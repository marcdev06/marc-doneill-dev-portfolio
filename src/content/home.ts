import { homeSchema, parseContent } from '@/lib/content';

export const home = parseContent(
  homeSchema,
  {
    hero: {
      greeting: "Hi, I'm Marc Doneill Balatayo",
      headline: {
        beforeHighlight: 'Building software that makes ',
        highlight: 'everyday life',
        afterHighlight: ' easier.',
      },
      typewriter: {
        prefix: "I'm a",
        phrases: [
          'full-stack software engineer.',
          'Spring Boot & GraphQL developer.',
          'React & Next.js developer.',
        ],
      },
      evidence: [
        { text: 'Mid-Level Full-Stack Software Engineer at ' },
        { text: 'KwikCare', href: 'https://kwik.care/kwikcare' },
        { text: ", building its HMO platform. Before that: Singlife's Policy Admin System." },
      ],
      lead: '4+ years building web apps end to end: React and Next.js front ends, Spring Boot and GraphQL APIs, and the PostgreSQL databases behind them.',
      primaryAction: { label: 'Work with me', href: '#contact' },
      secondaryAction: { label: 'See experience', href: '#experience' },
    },
    experience: { heading: 'Experience' },
    skills: { heading: 'Technical Skills' },
    education: { heading: 'Education' },
    about: {
      heading: 'About',
      paragraph:
        "I'm a full-stack engineer based in Taguig City. At KwikCare, a health care plan (HMO) provider, I work across the stack with Spring Boot, JHipster, React, Next.js and GraphQL. Before that I spent over two years at Singlife Philippines, building features for its Policy Admin System and doing a stint as production tech support, fixing live issues. I started at Workbean, an employer branding company, where I went from intern to software engineer and owned the backend service behind its product. I enjoy building apps and systems that make everyday life easier, and I also take on freelance, contract and part-time projects. Right now I'm learning how to get the most out of AI in my development workflow.",
      howIWork: {
        heading: 'How I work',
        text: 'I document what I build, test before I hand work off, and work as well on my own as in a team.',
      },
    },
    contact: {
      heading: "Let's build something",
      form: {
        fields: {
          name: {
            label: 'Name',
            error: 'Please enter your name (2 to 100 characters).',
          },
          email: {
            label: 'Email',
            error: 'Please enter a valid email address, like name@example.com.',
          },
          message: {
            label: 'Message',
            error: 'Please write a message of 20 to 5,000 characters.',
          },
        },
        honeypotLabel: 'Company website',
        submitLabel: 'Send message',
        pendingLabel: 'Sending…',
        privacyNote: "Your message goes straight to my inbox; this site doesn't store it.",
        successMessage: "Thanks, your message was sent. I'll get back to you soon.",
        failureMessage: {
          beforeLink:
            "Sorry, your message couldn't be sent. Please try again in a few minutes, or message me on ",
          linkLabel: 'LinkedIn',
          afterLink: '.',
        },
      },
      resumeRequest: {
        triggerLabel: 'Request my resume',
        title: 'Request my resume',
        intro:
          "Share your name and email and I'll approve your request personally, usually within a few minutes. Keep this window open: the download starts as soon as I approve.",
        closeLabel: 'Close',
        fields: {
          name: {
            label: 'Name',
            error: 'Please enter your name (2 to 100 characters).',
          },
          email: {
            label: 'Email',
            error: 'Please enter a valid email address, like name@example.com.',
          },
          note: {
            label: "What's it for? (optional)",
            error: 'Please keep the note to 500 characters.',
          },
        },
        honeypotLabel: 'Company website',
        privacyNote:
          'Your name and email go only to me and are deleted automatically after 24 hours.',
        submitLabel: 'Send request',
        pendingLabel: 'Sending…',
        waitingMessage: 'Request sent. Waiting for my approval; this usually takes a few minutes.',
        approvedMessage: 'Approved. Your download is starting.',
        downloadLabel: 'Download the PDF',
        deniedMessage:
          "Sorry, I can't share my resume for this request. You can still reach me through the contact form.",
        expiredMessage:
          "I haven't been able to approve this yet. I have your details and will reply by email.",
        rateLimitedMessage:
          "You've reached the request limit. Please try again tomorrow, or use the contact form.",
        failureMessage:
          "Sorry, the request couldn't be sent. Please try again later, or use the contact form.",
      },
    },
  },
  'src/content/home.ts',
);
