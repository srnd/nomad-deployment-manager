import Link from 'next/link'
import { getJob } from '../../../../utils/nomad'
import { getBuildsForProject } from '../../../../utils/circleci';
import { useState } from 'react';

import Layout from '../../../../components/layout'

import Button from '@codeday/topo/Atom/Button';
import Text from '@codeday/topo/Atom/Text';
import { default as Input } from '@codeday/topo/Atom/Input/Text';
import Box, { Flex } from '@codeday/topo/Atom/Box';
import { useToasts } from '@codeday/topo/utils';

async function postUpdatedTag (jobId, groupName, taskName, newTag) {
    return fetch(`/api/${jobId}/${groupName}/${taskName}/update-tag`, {
      method: 'POST',
      body: JSON.stringify({tag: newTag}),
    });
}

export const getServerSideProps = async ({ params }) => {
  const job = await getJob(params.jobId);
  const taskGroup = job.TaskGroups.filter((tg) => tg.Name === params.groupName)[0];
  const task = taskGroup.Tasks.filter((t) => t.Name === params.taskName)[0];
  const [ repoName, tag ] = task.Config.image.split(':', 2);
  var builds = [];
  try {
    builds = await getBuildsForProject(repoName);
  } catch (ex) {}

  return {
    props: {
      job,
      taskGroup,
      task,
      builds,
      repo: repoName,
      defaultTag: tag,
    },
  };
};

const Menu = ({id}) => (
  <Link href={`/jobs/${id}`}>
    <Button as="a" variant="outline" variantColor="brand">
      &laquo; Back to {id}
    </Button>
  </Link>
)

export default ({ job, taskGroup, task, repo, defaultTag, builds }) => {
  const [ tag, setTag ] = useState(defaultTag);
  const { success, error } = useToasts();


  return (
    <Layout
      extendMenu={<Menu id={job.ID} />}
    >
      <Text textTransform="uppercase" fontWeight="bold" fontSize="3xl" as='h1' paddingRight={4}>
        {job.ID} &rarr; {taskGroup.Name} &rarr; {task.Name}
      </Text>
      <Box padding={2} marginY={2} rounded="lg">
        <Flex justify="space-between">
          <Flex align="center" w="100%" pr={1} >
            <Text as="span" whiteSpace="nowrap">{repo}</Text>
            <Text as="span" paddingX={1}>:</Text>
            <Input as="input" fontWeight="bold" type="text" value={tag} onChange={(e) => setTag(e.target.value)} />
          </Flex>
          <Button
            type="button"
            onClick={async () => {
              const status = await postUpdatedTag(job.ID, taskGroup.Name, task.Name, tag)
              if (status.ok) {
                success("Job Deployed!")
              } else {
                error("Something went wrong, sorry m8!")
              }
            }}
          >
            Deploy
          </Button>
        </Flex>
      </Box>
      {builds && (
        <Box padding={4} marginY={4} backgroundColor="green.100" borderColor="green.700" borderLeftWidth="6px">
          {builds.map((build) => (
            <Text style={{ fontWeight: tag === build.id ? '700' : '500' }} key={build.id}>
              <Text
                as="a"
                onClick={(e) => { e.preventDefault(); setTag(build.id); return false; }}
              >
                {build.id}
              </Text>
              (&ldquo;{build.message}&rdquo; &mdash;{build.committer})
            </Text>
          ))}
        </Box>
      )}
    </Layout>
  )
};
