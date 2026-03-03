import { useMemo, useState } from 'react';
import { useStore } from '../state/store';

export function App() {
  const { project, addDevice, selectedId, select, moveDevice, startLink, completeLink, linkStart, runPing, logs, runCli, saveProject, loadProject } = useStore();
  const [pingTarget, setPingTarget] = useState('');
  const [cliCmd, setCliCmd] = useState('');

  const selectedDevice = project.devices.find((d) => d.id === selectedId);
  const selectedConfig = selectedId ? project.deviceConfigs[selectedId] : undefined;

  const posById = useMemo(() => Object.fromEntries(project.devices.map((d) => [d.id, d.position])), [project.devices]);

  return <div className="layout">
    <aside className="left">
      <h2>Biblioteca</h2>
      <button draggable onDragStart={(e) => e.dataTransfer.setData('kind', 'router')}>Router Genérico</button>
      <button draggable onDragStart={(e) => e.dataTransfer.setData('kind', 'pc')}>PC Genérico</button>
      <hr />
      <button onClick={() => {
        const text = saveProject();
        const blob = new Blob([text], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'topologia.netlab.json'; a.click();
      }}>Guardar Proyecto</button>
      <label className="upload">Abrir Proyecto<input type="file" accept=".json,.netlab" onChange={(e) => {
        const f = e.target.files?.[0]; if (!f) return; f.text().then(loadProject);
      }} /></label>
    </aside>
    <main className="canvasWrap" onDragOver={(e) => e.preventDefault()} onDrop={(e) => {
      const kind = e.dataTransfer.getData('kind') as 'router' | 'pc';
      if (!kind) return;
      const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
      addDevice(kind, e.clientX - r.left, e.clientY - r.top);
    }}>
      <svg className="links">{project.links.map((l) => {
        const a = posById[l.aDeviceId]; const b = posById[l.bDeviceId];
        if (!a || !b) return null;
        return <line key={l.id} x1={a.x + 55} y1={a.y + 25} x2={b.x + 55} y2={b.y + 25} stroke="#6dd3ff" strokeWidth={3} />;
      })}</svg>
      {project.devices.map((d) => <div
        className={`node ${selectedId === d.id ? 'selected' : ''}`}
        key={d.id}
        style={{ left: d.position.x, top: d.position.y }}
        onClick={(e) => { e.stopPropagation(); select(d.id); if (e.shiftKey) linkStart ? completeLink(d.id) : startLink(d.id); }}
        draggable
        onDragEnd={(e) => {
          const r = (e.currentTarget.parentElement as HTMLDivElement).getBoundingClientRect();
          moveDevice(d.id, e.clientX - r.left, e.clientY - r.top);
        }}
      >{d.name}<small>{d.kind}</small></div>)}
    </main>
    <aside className="right">
      <h3>Inspector</h3>
      {selectedDevice && <>
        <div>{selectedDevice.name}</div>
        <input placeholder="IP destino" value={pingTarget} onChange={(e) => setPingTarget(e.target.value)} />
        <button onClick={() => runPing(selectedDevice.id, pingTarget)}>Lanzar Ping</button>
        <h4>Terminal</h4>
        <input value={cliCmd} onChange={(e) => setCliCmd(e.target.value)} onKeyDown={(e) => {
          if (e.key === 'Enter') {
            runCli(selectedDevice.id, cliCmd);
            setCliCmd('');
          }
        }} placeholder="comando..." />
        <pre>{JSON.stringify(selectedConfig, null, 2)}</pre>
      </>}
      <h4>Registro</h4>
      <pre className="log">{logs.join('\n')}</pre>
    </aside>
  </div>;
}
