const triggerAndWait = async ({ github, context }) => {
  const owner = 'ldraney'; // Replace with your GitHub username or organization
  const repo = 'private-repo'; // Replace with your repository name
  const workflow_id = 'private-workflow.yml'; // Replace with your workflow file name or ID
  const ref = 'master'; // Usually main or master

  // Define the inputs required by the workflow
  const inputs = {
    environment: 'your-environment', // Replace with the actual environment value or use dynamic input
  };

  // Trigger the workflow
  console.log(`Triggering workflow: ${workflow_id} on ${owner}/${repo}`);
  await github.rest.actions.createWorkflowDispatch({
    owner,
    repo,
    workflow_id,
    ref,
    inputs,
  });

  // Wait a moment for the workflow run to be initialized
  await new Promise(r => setTimeout(r, 5000));

  // Get the run ID of the triggered workflow
  let runs = await github.rest.actions.listWorkflowRuns({
    owner,
    repo,
    workflow_id,
    status: 'queued',
  });

  let run_id = runs.data.workflow_runs[0].id;
  console.log(`Triggered workflow run ID: ${run_id}`);

  // Wait for the workflow to complete
  let status;
  let conclusion;
  let workflow_url = `https://github.com/${owner}/${repo}/actions/runs/${run_id}`;
  do {
    await new Promise(r => setTimeout(r, 10000)); // Poll every 10 seconds
    const result = await github.rest.actions.getWorkflowRun({
      owner,
      repo,
      run_id,
    });
    status = result.data.status;
    conclusion = result.data.conclusion;
    console.log(`Current status: ${status}`);
  } while (status !== 'completed');

  // Log the conclusion and the workflow URL
  console.log(`Workflow conclusion: ${conclusion}`);
  console.log(`Workflow run URL: ${workflow_url}`);

  // Fetch the logs or outputs if necessary
  if (conclusion === 'success') {
    // If your workflow produces artifacts, you can fetch them here
    const artifacts = await github.rest.actions.listWorkflowRunArtifacts({
      owner,
      repo,
      run_id,
    });
    console.log('Artifacts:', artifacts.data.artifacts);
    // Additional processing to download or extract data from artifacts can be done here
  } else {
    console.log('Workflow failed. No artifacts fetched.');
  }
};

module.exports = triggerAndWait;

