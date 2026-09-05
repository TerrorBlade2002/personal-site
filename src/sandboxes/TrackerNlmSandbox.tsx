import TrackerCore from './trackerCore'

export default function TrackerNlmSandbox() {
  return (
    <TrackerCore
      cfg={{
        id: 'tracker-nlm',
        title: 'nlm-usage-tracker — notebook engagement dashboard',
        entityLabel: 'notebook',
        entities: ['FDCPA Reference NB', 'Client Playbooks NB', 'Training Library NB', 'Scripts & Rebuttals NB', 'State Regs NB'],
        users: ['a.sharma', 'j.fernandez', 'k.osei', 'm.chen', 'r.kapoor', 's.ivanova', 't.nguyen', 'd.okafor'],
        note: 'the real extension is published on the Chrome Web Store and force-installed via GPO, with a logon-script native host for username capture. It tracks every NotebookLM notebook — no allowlist — capturing 6 fields per turn.',
      }}
    />
  )
}
