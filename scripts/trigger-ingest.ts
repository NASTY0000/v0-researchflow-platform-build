async function triggerIngest() {
  const res = await fetch(
    'https://researchflowafrica.com/api/feed/ingest',
    {
      headers: {
        Authorization: `Bearer ${process.env.CRON_SECRET}`
      }
    }
  )
  const data = await res.json()
  console.log('Ingestion result:', JSON.stringify(data, null, 2))
}

triggerIngest()
