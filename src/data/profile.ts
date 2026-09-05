export type Experience = {
  id: string
  kind: 'work' | 'education' | 'award' | 'project'
  title: string
  org: string
  location?: string
  start: string
  end: string
  current?: boolean
  summary: string
  bullets?: string[]
  tags?: string[]
  link?: string
  linkLabel?: string
}

export const profile = {
  name: 'Arnab',
  fullName: 'Arnab Mondal',
  handle: 'TerrorBlade2002',
  role: 'AI Engineer',
  company: 'MSCI',
  previous: { title: 'Manager · Data Scientist', org: 'Astra Global', period: 'Oct 2025 – Jul 2026' },
  location: 'Pune, IN',
  email: 'arnabmondal2002@gmail.com',
  github: 'https://github.com/TerrorBlade2002',
  linkedin: 'https://www.linkedin.com/in/arnab-mondal-26a3b9239/',
  linkedinLabel: 'linkedin.com/in/arnab-mondal',
  education: 'B.Tech, IIT Bombay (2020–2024)',
  tagline: 'I build production voice agents, ML pipelines and the observability that keeps them honest.',
  about: [
    'AI Engineer at MSCI (Pune). Before that, Manager · Data Scientist at Astra Global, where I shipped AI systems that survived contact with production: a LiveKit voice agent live for two paying clients at p95 1.1s end-of-turn and $0.07/min, a multi-agent call auditor that lifted QA checklist accuracy from 92.6% to 99.4%, usage telemetry for 400+ users, a voicemail platform pushing 5k TTS messages a day — and the Prometheus/Grafana plumbing that proved all of it worked.',
    'My happy place is the seam between ML and infrastructure — where a model is only as good as its latency budget, its retry ladder and its cost-per-call. Most of what you see in the archive was built during the Astra Global years; the rest is independent work from my IIT Bombay days onward.',
    'This site is a hands-on museum: every project has a sandbox — a small, honest simulation of the real system you can poke at in the browser — plus the numbers and architecture of the production version.',
  ],
  skills: {
    'Voice AI': ['LiveKit Agents', 'Retell AI', 'OpenAI Realtime API', 'Deepgram', 'Cartesia TTS', 'voice cloning', 'WebRTC / SIP telephony (TCN, Croco)', 'turn detection & barge-in'],
    'LLM & Agents': ['LangGraph', 'LangChain', 'LangSmith / Langfuse', 'DSPy / GEPA', 'Google ADK', 'agentic RAG & CAG', 'semantic chunking', 'LLM-as-judge', 'Pinecone / Chroma'],
    'ML': ['PyTorch', 'HuggingFace', 'XGBoost', 'MLflow', 'QLoRA / PEFT fine-tuning', 'vLLM', 'RAGAS evals'],
    'Data & Streaming': ['Apache Kafka', 'PySpark', 'Airflow', 'PostgreSQL', 'pgvector', 'Spanner', 'BigQuery', 'Redis'],
    'Backend': ['FastAPI', 'Node.js', 'C# / .NET', 'async SQLAlchemy', 'state machines', 'transactional outbox', 'durable queues', 'Supabase'],
    'Observability': ['Prometheus', 'Grafana', 'Loki', 'Alertmanager', 'cost telemetry', 'SLO alerts', 'CI eval gates'],
    'Frontend': ['React', 'TypeScript', 'Next.js', 'Vite', 'Tailwind', 'Three.js', 'Chrome extensions', 'Playwright'],
    'Cloud & Infra': ['GCP (Cloud Run)', 'AWS', 'Docker', 'Kubernetes', 'Railway', 'Runpod', 'Cloudflare R2', 'Microsoft Graph / Entra', 'Twilio / SendGrid'],
  } as Record<string, string[]>,
  experience: [
    {
      id: 'msci',
      kind: 'work',
      title: 'AI Engineer',
      org: 'MSCI Inc.',
      location: 'Pune, IN · hybrid',
      start: 'Aug 2026',
      end: 'Present',
      current: true,
      summary: 'Current chapter: AI engineering at one of the world’s largest providers of investment indexes, analytics and risk tooling.',
      tags: ['AI systems', 'LLM engineering', 'Python'],
    },
    {
      id: 'astra',
      kind: 'work',
      title: 'Manager · Data Scientist',
      org: 'Astra Global (Astra Business Services Pvt. Ltd.)',
      location: 'Noida, IN · on-site',
      start: 'Oct 2025',
      end: 'Jul 2026',
      summary: 'Owned the voice-AI and analytics stack end to end — from agents on live dialers to the observability that graded them. Almost everything in the archive was built here. Recognized for $15k+ in added revenue and cost savings in 10 months.',
      bullets: [
        'Virtual Transfer Agent (LiveKit Cloud): ultra-low-latency AI lead-qualifier + live-transfer agent with cloned voices — p95 1.1s / p99 1.65s end-of-turn, $0.07/min average against a $0.11/min cap; live for the internal team + 2 clients across 2 revenue lines. GEPA tuning on a self-authored eval schema, per-turn test suites, 25+ metric series on Prometheus/Grafana/Loki. Built a one-of-its-kind three-way conferencing layer bridging it to legacy telephony (TCN, Croco) — IP pending.',
        'Call Audit Supervisor: multi-agent QA platform at $0.06/call-min — rubric distiller, multimodal judge (audio + transcript), cost-aware router, objection clustering, RL-tuned rewriter, feedback agent. Checklist accuracy 92.6% → 99.4% vs 3 junior QAs; CI eval gate. Cloud Run, Spanner, Gemini.',
        'Realtime Agent Copilot (C#): in-call compliance assist — policy engine + confidence-gated LLM calls; 98.5% faithfulness and suggestion accuracy at 0.9s per suggestion, abstains rather than guess.',
        'LLM usage observability: Chrome-extension APIs + a native host picking up system usernames, GPO-rolled to 400+ users across 12 portfolios; daily job across 12 Custom GPTs and every NotebookLM notebook, ~0.8s p90 dashboards.',
        'Dashboard Analytics Orchestrator (LangGraph): Excel dashboards to natural language via a versioned metric registry + RAG — 200+ metrics, 12 portfolios, top-3 recall 93%, mapping precision 91%, NL→query 89%, p50 1.8s.',
        'Astra Licensing Automation: Entra/Graph mailbox ingestion — intent parsing, notifications, document packets behind a central portal, with an audited state machine and mandatory human approval.',
        'VocalDirect: self-hosted voicemail platform (Runpod) on Qwen-3-1.7B / A100 — 5k voicemails/day, 40 agents, 300k weekly TTS across 20 portfolios → +3.5% RPC, +8% callbacks.',
        'Also: a verbal-assessment platform (1k+ interviews; React, Firebase, SpeechSuper, HeyGen), WordPress/PHP site ownership, dashboard automation (AutoHotkey, Playwright), Twilio/SendGrid letter campaigns.',
      ],
      tags: ['Voice AI', 'LiveKit', 'Retell AI', 'LangGraph', 'RAG', 'LLM-as-judge', 'Observability', 'Chrome extensions', 'Cloud Run', 'Railway'],
    },
    {
      id: 'launchpad',
      kind: 'award',
      title: 'National Finalist — Launchpad ’25 Case Competition',
      org: 'BTribe',
      start: 'Mar 2025',
      end: 'Apr 2025',
      summary: 'One of 21 finalist teams out of 867; presented a 6-slide deck to IIM alumni in the final round.',
      tags: ['strategy', 'storytelling'],
    },
    {
      id: 'ml-2025',
      kind: 'project',
      title: 'Independent ML systems',
      org: 'Self-directed',
      start: 'May 2025',
      end: 'Aug 2025',
      summary: 'A Dockerized real-time fraud-detection pipeline (Kafka, Airflow, MLflow, MinIO, XGBoost, PySpark — AUC-PR 0.77, recall 0.95 on 150k samples), a semantic book recommender (LangChain/Chroma + zero-shot & emotion models), and an NLP-scored verbal assessment system.',
      tags: ['MLOps', 'Kafka', 'XGBoost', 'LangChain', 'Gradio'],
      link: '/projects/fraud-detection',
      linkLabel: 'play with the fraud pipeline →',
    },
    {
      id: 'iitb',
      kind: 'education',
      title: 'B.Tech — Bachelor of Technology',
      org: 'Indian Institute of Technology Bombay',
      location: 'Mumbai, IN',
      start: '2020',
      end: '2024',
      summary: 'Where the first repos happened: competitive programming, a Django storefront for Season of Code ’22, and the habit of shipping things that strangers can open.',
      tags: ['IIT Bombay', 'Season of Code'],
      link: '/projects/ecomm',
      linkLabel: 'see the 2022 storefront →',
    },
  ] as Experience[],
}
