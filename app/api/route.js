import { NextResponse } from 'next/server';
import https from "https";
import { parse } from 'ipaddr.js'

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const ip = searchParams.get('ip');
    try {
        const addr = parse(ip);

        const ipKind = addr.kind()// 'ipv4' or 'ipv6'
        let family = 4;
        if (ipKind === 'ipv6') {
            family = 6;
        }

        let result = ''
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
                console.log(cfIp);
                result = `
proxy ip is ${ip}, cloudflare ip is ${cfIp},  ${ip === cfIp ? 'can(可以)' : 'can not (不能)'} use as proxy ip.

-------------full curl -v https://cloudflare.com/cdn-cgi/trace --resolve cloudflare.com:${ip}--------------
${text}
`;
                console.log('+++++++++++', result);
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

        return new NextResponse(result,
            {
                status: 200
            });

    } catch (e) {
        return new NextResponse(JSON.stringify(e),
            {
                status: 500
            })
    }
}