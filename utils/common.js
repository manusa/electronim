const refPrefix = 'refs/tags/v';

const extractVersionFromTag = () => {
  const githubRef = process.env.GITHUB_REF;
  if (githubRef && githubRef.startsWith(refPrefix)) {
    return githubRef.replace(refPrefix, '');
  }
  return null;
};

module.exports = {
  extractVersionFromTag
};
