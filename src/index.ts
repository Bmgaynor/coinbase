import express from 'express'
import axios from 'axios'

const CLIENT_ID = '2371902b89f3b4184f516668ddc4cf0d178055ad6f2e05c8859ace0830b303a8'
const SECRET = ''
const TARGET_URL = 'http://localhost:3000'
const REDIRECT_URL =  `https://www.coinbase.com/oauth/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${TARGET_URL}&state=SECURE_RANDOM&scope=wallet:accounts:read`
const EXCHANGE_URL = `https://api.coinbase.com/oauth/token`
const app = express()

interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}
async function login (code: string) {
  try {
    const res = await axios.post<LoginResponse>(EXCHANGE_URL, {
      grant_type: 'authorization_code',
      code,
      client_id: CLIENT_ID,
      client_secret: SECRET,
      redirect_uri: TARGET_URL
    })
    return res.data  
  } catch (err) {
    console.error(err)
  }
  
}
app.use('/prices', async (req, res) => {
  const pricesResp = await axios.get('https://api.coinbase.com/v2/prices/spot?currency=USD')
  return res.json(pricesResp.data)
})

app.use('/', async function (req, res, next) {
  console.log('express responding to', req.path)
  console.log(req.query)
  const code = req.query['code'] as string
  const isLogin = req.query['login']
  if (code) { // if code login
    const data = await login(code)
    res.redirect(`/?token=${data.access_token}`)

  } else if (req.query['user']) {
    const resp = await axios.get('https://api.coinbase.com/v2/user', {
      headers: {
        'Authorization': 'Bearer ' + req.query['token']
      }
    })
    res.json(resp.data)
  } else if (req.query['token']) { // if token 
    res.send('logged in')
  } else if (isLogin) { // if no token or login
    res.redirect(REDIRECT_URL)
  } else {
    res.redirect('/?login=true')
  }
})



app.listen(3000, () => {
  console.log('listening on port 3000')
})
