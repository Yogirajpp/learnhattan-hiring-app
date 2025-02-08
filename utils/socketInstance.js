import express from "express";
import Projects from "../models/Projects.js";
import NodeCache from "node-cache";
import { fetchGithubRepo, getAllProjects, getIssueComments, getProjectIssues } from "../controllers/projectContoller.js";
import { handlePullRequestMerge } from "./common.js";

const cache = new NodeCache({ stdTTL: 86400 }); // 24-hour cache
const activeUsers = new Map();

export const socketHandler = (io) => {
  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Register active user with socket ID
    socket.on("registerUser", ({ userId }) => {
      activeUsers.set(socket.id, userId);
      console.log(`🔗 User ${userId} registered with socket ${socket.id}`);
    });

    // Join project room
    socket.on("joinProject", ({ projectId }) => {
      socket.join(`project_${projectId}`);
      console.log(`Socket ${socket.id} joined room project_${projectId}`);
    });

    // Fetch all projects (cache-first)
    socket.on("getAllProjects", async ({ userId }, callback) => {
      try {
        let projects = cache.get("allProjects");
        if (!projects) {
          projects = await getAllProjects(userId);
          cache.set("allProjects", projects);
        }
        callback({ success: true, projects });
      } catch (error) {
        callback({ success: false, error: "Failed to fetch projects" });
      }
    });

    // Fetch GitHub repo details (cache-first)
    socket.on("fetchRepo", async ({ userId, owner, repoName }, callback) => {
      try {
        if (!owner || !repoName) {
          return callback({ success: false, error: "Owner and repoName are required" });
        }

        const cacheKey = `repo_${owner}_${repoName}`;
        let project = cache.get(cacheKey);

        if (!project) {
          project = await fetchGithubRepo(userId, owner, repoName);
          cache.set(cacheKey, project);
        }

        callback({ success: true, project });
      } catch (error) {
        callback({ success: false, error: "Failed to fetch GitHub repo" });
      }
    });

    // Fetch project issues (cache-first)
    socket.on("getProjectIssues", async ({ userId, projectId, state }, callback) => {
      try {
        let issues = cache.get(`issues_${projectId}_${state}`);
        if (!issues) {
          issues = await getProjectIssues(userId, projectId, state);
          cache.set(`issues_${projectId}_${state}`, issues);
        }
        callback({ success: true, issues });
      } catch (error) {
        callback({ success: false, error: "Failed to fetch project issues" });
      }
    });

    // Fetch issue comments
    socket.on("getIssueComments", async ({ userId, owner, repoName, issueId }, callback) => {
      try {
        if (!owner || !repoName || !issueId) {
          return callback({ success: false, error: "Owner, repoName, and issueId are required" });
        }

        const comments = await getIssueComments(userId, owner, repoName, issueId);
        callback({ success: true, comments });
      } catch (error) {
        callback({ success: false, error: "Failed to fetch issue comments" });
      }
    });

    // Handle pull request merge and live update
    socket.on("pullRequestMerged", async ({ repoData }) => {
      try {
        console.log("🔹 PR merged event detected");
        await handlePullRequestMerge(repoData);

        const projects = await Projects.find();
        for (const project of projects) {
          const userId = [...activeUsers.values()][0];
          if (!userId) continue;

          const projectId = project._id;
          const openIssues = await getProjectIssues(userId, projectId, "open");
          const closedIssues = await getProjectIssues(userId, projectId, "closed");

          cache.set(`issues_${projectId}_open`, openIssues);
          cache.set(`issues_${projectId}_closed`, closedIssues);

          io.to(`project_${projectId}`).emit("updateProjectIssues", {
            projectId,
            issues: openIssues,
          });
        }
      } catch (error) {
        console.error("❌ Error handling pull request merge:", error);
      }
    });

    // Handle client disconnect
    socket.on("disconnect", () => {
      activeUsers.delete(socket.id);
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
};
