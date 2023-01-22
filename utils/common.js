const refPrefix = 'refs/tags/v';

const extractVersionFromTag = () => {
  for (const githubRef of [process.env.GITHUB_REF, process.env.WORKFLOW_DISPATCH_GITHUB_REF]) {
    if (githubRef && githubRef.startsWith(refPrefix)) {
      return githubRef.replace(refPrefix, '');
    }
  }
  return null;
};

module.exports = {
  extractVersionFromTag
};
