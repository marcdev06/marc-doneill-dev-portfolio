import { parseContent, skillsSchema } from '@/lib/content';

export const skills = parseContent(
  skillsSchema,
  {
    core: {
      label: 'Core',
      summary: 'Daily use',
      groups: [
        { group: 'Languages', names: ['TypeScript', 'JavaScript', 'Java'] },
        { group: 'Front end', names: ['React', 'Next.js', 'Tailwind CSS', 'Bootstrap'] },
        { group: 'Back end', names: ['Spring Boot', 'JHipster', 'GraphQL', 'Node.js'] },
        { group: 'Data', names: ['PostgreSQL', 'MySQL'] },
      ],
    },
    comfortable: {
      label: 'Comfortable',
      groups: [
        { group: 'Languages', names: ['Python'] },
        { group: 'Front end', names: ['Vite', 'Zustand'] },
        { group: 'Back end', names: ['Express.js', 'REST APIs'] },
        { group: 'Data', names: ['MongoDB', 'Amazon DynamoDB', 'Amazon QLDB'] },
        { group: 'Cloud/DevOps', names: ['AWS'] },
        { group: 'Testing', names: ['Vitest', 'Playwright'] },
      ],
    },
    past: {
      label: 'Past experience',
      groups: [
        { group: 'Languages', names: ['C#', 'Solidity', 'Dart'] },
        { group: 'Front end / mobile', names: ['Vue', 'Ionic', 'Flutter'] },
        { group: 'Back end', names: ['ASP.NET Core', 'Flask'] },
        { group: 'Other', names: ['Blockchain / Ethereum'] },
      ],
    },
  },
  'src/content/skills.ts',
);
