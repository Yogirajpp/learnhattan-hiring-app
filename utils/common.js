export const calculateExpRange = (forks, closedIssues, stars) => {
  // New dynamic EXP range limits
  const baseExp = 50; // Minimum EXP for the weakest projects
  const highExp = 1500; // Maximum EXP for the best projects

  // Logarithmic scaling to balance weight distribution
  const forksWeight = Math.log2(forks + 2) * 1.4;
  const closedIssuesWeight = Math.log2(closedIssues + 2) * 1.8;
  const starsWeight = Math.log2(stars + 2) * 1.3;

  // Compute weighted project strength
  const weightedValue =
    forks * forksWeight +
    closedIssues * closedIssuesWeight +
    stars * starsWeight;

  // Normalize EXP dynamically based on project strength
  let normalizedExp = Math.min(
    highExp,
    Math.max(baseExp, Math.log2(weightedValue + 5) * 180) // Adjusted scaling factor
  );

  // Dynamically adjust the range based on project quality
  const rangeFactor = Math.log2(weightedValue + 3) * 0.2; // Increases range for better projects
  const rangeSize = Math.min(500, Math.max(30, normalizedExp * rangeFactor)); // Ensures weak projects have a smaller range

  return {
    min: Math.floor(normalizedExp - rangeSize * 0.5), // Lower bound
    max: Math.floor(normalizedExp + rangeSize * 0.5), // Upper bound
  };
};

export const assignIssueExp = (issue, minExp, maxExp) => {
  // Ensure a meaningful range for issue EXP, dynamically adjusted
  const expRange = Math.max(30, maxExp - minExp); // Prevent extreme values while allowing good variation

  // Adjusted weight values for fair contribution distribution
  const commentsWeight = 2.2;
  const labelsWeight = 1.6;
  const bodyLengthWeight = 0.015; // Balanced to avoid excessive impact

  // Compute weighted scores
  const commentsScore = issue.comments * commentsWeight;
  const labelsScore = (issue.labels?.length || 0) * labelsWeight;
  const bodyScore = (issue.body?.length || 0) * bodyLengthWeight;

  // Total contribution score
  const totalScore = commentsScore + labelsScore + bodyScore;

  // Normalize EXP within range, ensuring fairness
  const issueExp = Math.min(
    maxExp,
    Math.max(minExp, minExp + (totalScore / 3) % expRange)
  );

  return Math.floor(issueExp);
};
