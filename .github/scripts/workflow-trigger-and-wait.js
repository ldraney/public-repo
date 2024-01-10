const triggerAndWait = async ({ github, context }) => {
  const owner = 'ldraney'; // the private repo owner
  const repo = 'private-repo'; // the private repo 
  const workflow_id = 'private-workflow.yml'; // Replace with your workflow file name or ID
  const ref = 'master'; // branch of the workflow you want to use
  const jobName = 'say-hello'; // Replace with the name of the job you want

  // Define the inputs required by the workflow
  const inputs = {
  environment: context.payload.inputs.environment,
  // ref: context.payload.inputs.ref,
};

  const triggerTimestamp = new Date().toISOString();

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

  // Poll for the workflow run
  let run_id;
  while (!run_id) {
	const runs = await github.rest.actions.listWorkflowRuns({
	  owner,
	  repo,
	  workflow_id,
	  created: `>=${triggerTimestamp}`
	});

	// Find the run
	// Assuming the first run after our timestamp is the one we triggered
	if (runs.data.workflow_runs.length > 0) {
	  run_id = runs.data.workflow_runs[0].id;
	  break;
	}

	// Wait before polling again
	// Github api has a limit of either 1,000 or 15,000, based on if the VA is on GitHub Enterprise Cloud or not.
	await new Promise(r => setTimeout(r, 1000));
  }

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

  const jobs = await github.rest.actions.listJobsForWorkflowRun({
	owner,
	repo,
	run_id: run_id, // Replace with the actual run ID
  });

  const job = jobs.data.jobs.find(j => j.name === jobName);
  if (!job) {
	console.log(`Job '${jobName}' not found in workflow run.`);
	return;
  }

  console.log(`the job is '${job}'`)


  // Fetch the logs or outputs if necessary
  // if (conclusion === 'success') {
	  // const job_logs = github.rest.actions.downloadJobLogsForWorkflowRun({
	  // owner,
	  // repo,
	  // job_id,
	  // });

	  // console.log('${job_logs}')

    // // // If your workflow produces artifacts, you can fetch them here
    // // const artifacts = await github.rest.actions.listWorkflowRunArtifacts({
      // // owner,
      // // repo,
      // // run_id,
    // // });
    // // console.log('Artifacts:', artifacts.data.artifacts);
    // // // Additional processing to download or extract data from artifacts can be done here
  // } else {
    // // console.log('Workflow failed. No artifacts fetched.');
	// console.log('cannot find logs');
  // }
};

module.exports = triggerAndWait;

