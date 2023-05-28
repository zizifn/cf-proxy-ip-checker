import Image from 'next/image'
import styles from './page.module.css'
import { parse } from 'ipaddr.js'
import https from "https";

export default async function Home({ searchParams }) {
  console.log(searchParams);
  const ip = searchParams.ip;
  let addr = null;
  try{
    addr = parse(ip);
  }catch(e){
    return (
      <main className={styles.main}>
        <h1 className={styles.title}>
          no ipput ip or ip is not ipv4/6. {e.message}
        </h1>
      </main>
    )
  }

  const ipKind = addr.kind()// 'ipv4' or 'ipv6'
  let family = 4;
  if (ipKind === 'ipv6') {
    family = 6;
  }

  let result = {
    title: '',
    full: ''
  }
  await new Promise((resolve, reject) => {
    const rep = https.request({
      hostname: 'www.cloudflare.com',
      path: '/cdn-cgi/trace',
      method: 'GET',
      agent: new https.Agent({
        lookup: (hostname, options, callback) => {
          callback(null, ip, family);
        }
      })
    }, (res) => {
      res.on('data', (d) => {
        // fl=466f72
        // ip=
        // ts=1685291358.926
        // visit_scheme=https
        // uag=
        // colo=SJC
        // sliver=none
        // visit_scheme=https
        // uag=
        // colo=SJC
        // sliver=none
        // http=http/1.1
        // loc=CN
        // tls=TLSv1.3
        // sni=plaintext
        // warp=off
        // gateway=off
        // rbi=off
        // kex=X25519

        const text = d.toString();
        const maps = text.split('\n').map(line => {
          const [key, value] = line.split('=');
          return { key: key.trim(), value };
        });

        const cfIp = maps.find(item => item.key === 'ip').value;
        result.title = `proxy ip is ${ip}, cloudflare ip is ${cfIp},  ${ip === cfIp ? 'can(可以)' : 'can not (不能)'} use as proxy ip.`;
        result.full = `
-------------full curl -v https://cloudflare.com/cdn-cgi/trace --resolve cloudflare.com:${ip}--------------
${text}
`;
      })
      res.on('end', () => {
        console.log('No more data in response.');
        resolve(result);
      });

      res.on('error', (e) => {
        reject(e.message);
      });
    });
    rep.on('error', (e) => {
      reject(e.message);
    });
    rep.end();
  });


  return (
    <main className={styles.main}>
      <h1>
        {result.title}
      </h1>
      <pre>
        {result.full}
      </pre>
    </main>
  )
}
