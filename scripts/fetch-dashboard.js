(async () => {
  try {
    const res = await fetch('http://localhost:3001/api/dashboard')
    const text = await res.text()
    console.log('STATUS', res.status)
    console.log(text)
  } catch (e) {
    console.error('ERR', e.message || e)
    process.exitCode = 1
  }
})()
