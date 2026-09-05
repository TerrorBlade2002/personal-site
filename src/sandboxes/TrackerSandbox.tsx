import TrackerCore from './trackerCore'

export default function TrackerSandbox() {
  return (
    <TrackerCore
      cfg={{
        id: 'tracker-gpt',
        title: 'gpt-usage-tracker — fleet telemetry dashboard',
        entityLabel: 'Custom GPT',
        entities: ['Policy Navigator GPT', 'Dispute Letter GPT', 'Payment Plan GPT', 'Compliance QA GPT', 'Onboarding Buddy GPT'],
        users: ['a.sharma', 'j.fernandez', 'k.osei', 'm.chen', 'r.kapoor', 's.ivanova', 't.nguyen', 'd.okafor'],
        note: 'the production pipeline is a MV3 Chrome extension + native messaging host (real Windows usernames) + a Railway server, GPO-deployed to 400+ agents. This simulates 8 of them; the dashboard math and the CSV shape are the real ones.',
      }}
    />
  )
}
