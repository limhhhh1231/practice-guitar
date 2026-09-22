// Bundle selected CC BY 3.0 FluidR3 MP3 resources for fully offline playback.
const fs=require('fs');
const bank={guitars:{},drums:{}};
const names=['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
for(const name of ['steel','nylon','clean','muted']){
  const source=fs.readFileSync('/tmp/'+name+'-samples.js','utf8');
  const notes=Object.fromEntries([...source.matchAll(/"([A-G][b#]?\d+)":\s*"data:audio\/mp3;base64,([^"]+)"/g)].map(m=>[m[1],m[2]]));
  bank.guitars[name]={};
  for(let midi=40;midi<=76;midi+=6){const key=names[midi%12]+(Math.floor(midi/12)-1);if(!notes[key])throw Error('Missing '+key);bank.guitars[name][midi]='data:audio/mp3;base64,'+notes[key]}
}
for(const name of ['kick','snare','hat']){
  const source=fs.readFileSync('/tmp/fluid-'+name+'.js','utf8');
  const data=source.match(/,file:'([^']+)'/)[1],midi=Number(source.match(/,keyRangeLow:(\d+)/)[1]),pitch=Number(source.match(/,originalPitch:(\d+)/)[1]),fine=Number(source.match(/,fineTune:([\d.-]+)/)[1]);
  bank.drums[name]={data:'data:audio/mp3;base64,'+data,ratio:2**((midi*100-pitch-fine)/1200)};
}
fs.mkdirSync('assets',{recursive:true});fs.writeFileSync('assets/sample-bank.js','globalThis.GuitarSampleBank='+JSON.stringify(bank)+';\n');console.log('Offline sample bank:',fs.statSync('assets/sample-bank.js').size,'bytes');
