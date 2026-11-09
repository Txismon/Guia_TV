#!/usr/bin/env node
'use strict'

// Comprueba que una guia recien capturada sirve para algo antes de publicarla.
//
// Una captura fallida (un sitio que bloquea la IP, un cambio en su HTML) no deja
// un fichero roto sino un XML valido y casi vacio, y si se publicase sustituiria
// a la buena. Por eso se exige programacion para las proximas horas en un numero
// minimo de canales, y se imprime el resultado aunque falle para poder ver que
// ha pasado.
//
//   node check-guide.js guide.xml.gz [horas] [canales-minimos]

const fs = require('fs')
const zlib = require('zlib')

const ruta = process.argv[2]
const horas = Number(process.argv[3]) || 12
const minimo = Number(process.argv[4]) || 50

if (!ruta) {
	console.error('Uso: node check-guide.js <guia> [horas] [canales-minimos]')
	process.exit(2)
}

// "20261109060000 +0100" -> milisegundos UTC. Sin desplazamiento se asume UTC.
function hora(valor) {
	const m = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?\s*([+-]\d{4})?/.exec(String(valor || '').trim())
	if (!m) return null
	let t = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0))
	if (m[7]) {
		const signo = m[7][0] === '-' ? -1 : 1
		t -= signo * (+m[7].slice(1, 3) * 60 + +m[7].slice(3, 5)) * 60000
	}
	return t
}

let xml
try {
	const bruto = fs.readFileSync(ruta)
	xml = (bruto[0] === 0x1f && bruto[1] === 0x8b ? zlib.gunzipSync(bruto) : bruto).toString('utf8')
} catch (err) {
	console.error('ERROR: no se pudo leer la guia:', err.message)
	process.exit(1)
}

const ahora = Date.now()
const hasta = ahora + horas * 3600 * 1000

const declarados = new Set()
for (const m of xml.matchAll(/<channel\s[^>]*\bid="([^"]*)"/g)) declarados.add(m[1])

const conProgramas = new Set()
let enVentana = 0
let total = 0
for (const m of xml.matchAll(/<programme\s([^>]*)>/g)) {
	total++
	const atributos = m[1]
	const inicio = hora((/\bstart="([^"]*)"/.exec(atributos) || [])[1])
	const fin = hora((/\bstop="([^"]*)"/.exec(atributos) || [])[1])
	const canal = (/\bchannel="([^"]*)"/.exec(atributos) || [])[1]
	if (inicio === null || fin === null || !canal) continue
	if (fin > ahora && inicio < hasta) {
		enVentana++
		conProgramas.add(canal)
	}
}

console.log(`canales declarados:                      ${declarados.size}`)
console.log(`programas en total:                      ${total}`)
console.log(`con programacion en las proximas ${String(horas).padStart(2)} h:   ${conProgramas.size}`)
console.log(`programas en esa ventana:                ${enVentana}`)
console.log(`minimo exigido:                          ${minimo}`)

if (conProgramas.size < minimo) {
	console.error(`\nERROR: solo ${conProgramas.size} canales con programacion y se exigen ${minimo}. No se publica.`)
	process.exit(1)
}
