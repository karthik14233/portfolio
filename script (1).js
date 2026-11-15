(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  // Demo toggles
  document.querySelectorAll('.demo-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const demo = $(btn.getAttribute('aria-controls'));
      const open = demo.hidden;
      demo.hidden = !open;
      btn.setAttribute('aria-expanded', open);
      btn.textContent = open ? 'Hide demo' : 'Try browser demo';
    });
  });

  // ---- File organizer ----
  const CATS = {
    Images: ['jpg','jpeg','png','gif','webp','svg'],
    Documents: ['pdf','doc','docx','txt','md','ppt','pptx','xls','xlsx'],
    Code: ['py','js','html','css','java','c','cpp','json'],
    Videos: ['mp4','mov','avi','mkv'],
    Audio: ['mp3','wav','flac','m4a']
  };
  let fileNames = [];
  function categorize(name) {
    const ext = name.split('.').pop().toLowerCase();
    for (const c in CATS) if (CATS[c].includes(ext)) return c;
    return 'Other';
  }
  function renderFiles(label) {
    const groups = {};
    fileNames.forEach((n) => (groups[categorize(n)] = groups[categorize(n)] || []).push(n));
    $('files-summary').textContent = `${label} · ${fileNames.length} files`;
    $('files-out').innerHTML = Object.keys(groups).map((g) =>
      `<p><strong>${g} · ${groups[g].length}</strong><br>${groups[g].map(esc).join(', ')}</p>`).join('');
  }
  $('files-input').addEventListener('change', (e) => {
    fileNames = Array.from(e.target.files).map((f) => f.name);
    renderFiles('Your files');
  });
  $('files-sample').addEventListener('click', () => {
    fileNames = ['holiday.jpg','assignment.pdf','notes.txt','organize.py','lecture.mp4','song.mp3'];
    renderFiles('Sample files');
  });
  $('files-export').addEventListener('click', () => {
    if (!fileNames.length) return;
    const text = fileNames.map((n) => `${categorize(n)}\t${n}`).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], {type: 'text/plain'}));
    a.download = 'file-list.txt';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  // ---- Weather (Open-Meteo, no key) ----
  const WMO = {0:'Clear sky',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',45:'Fog',48:'Fog',51:'Light drizzle',53:'Drizzle',55:'Heavy drizzle',61:'Light rain',63:'Rain',65:'Heavy rain',71:'Light snow',73:'Snow',75:'Heavy snow',80:'Rain showers',81:'Rain showers',82:'Violent showers',95:'Thunderstorm',96:'Thunderstorm with hail',99:'Thunderstorm with hail'};
  $('weather-go').addEventListener('click', async () => {
    const out = $('weather-out');
    const city = $('city').value.trim();
    if (!city) { out.textContent = 'Enter a city name.'; return; }
    out.textContent = 'Loading…';
    try {
      const g = await (await fetch(`https://geocoding-api.open-meteo.com/v1/search?count=1&name=${encodeURIComponent(city)}`)).json();
      if (!g.results || !g.results.length) { out.textContent = `No city found for “${city}”. Check the spelling.`; return; }
      const p = g.results[0];
      const w = (await (await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p.latitude}&longitude=${p.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`)).json()).current;
      out.innerHTML = `<strong>${esc(p.name)}${p.country ? ', ' + esc(p.country) : ''}</strong><br>${esc(WMO[w.weather_code] || 'Unknown')} · ${w.temperature_2m}°C<br>Humidity ${w.relative_humidity_2m}% · Wind ${w.wind_speed_10m} km/h`;
    } catch (err) {
      out.textContent = 'Could not fetch weather. Check your connection and try again.';
    }
  });

  // ---- Marks analyzer ----
  const SAMPLE_CSV = 'Name,Marks\nAarav,82\nDiya,95\nIshaan,74\nMeera,89\nRohan,68';
  function analyze(csv, label) {
    const out = $('marks-out');
    const rows = csv.trim().split(/\r?\n/).map((r) => r.split(',').map((c) => c.trim()));
    const head = rows.shift().map((h) => h.toLowerCase());
    const ni = head.indexOf('name'), mi = head.indexOf('marks');
    if (ni < 0 || mi < 0) { out.textContent = 'CSV needs Name and Marks columns.'; return; }
    const data = rows.map((r) => ({name: r[ni], marks: parseFloat(r[mi])})).filter((d) => d.name && !isNaN(d.marks));
    if (!data.length) { out.textContent = 'No valid rows found.'; return; }
    const avg = data.reduce((s, d) => s + d.marks, 0) / data.length;
    const top = data.reduce((a, b) => (b.marks > a.marks ? b : a));
    out.innerHTML = `<p class="note">${label} · ${data.length} students</p>
      <p><strong>Average: ${avg.toFixed(1)} / 100</strong><br>Top score: ${top.marks} · ${esc(top.name)}</p>` +
      data.map((d) => `<div class="bar"><span>${esc(d.name)}</span><i style="width:${Math.max(0, Math.min(100, d.marks))}%"></i><span>${d.marks}</span></div>`).join('');
  }
  $('marks-sample').addEventListener('click', () => analyze(SAMPLE_CSV, 'Sample dataset'));
  $('marks-input').addEventListener('change', (e) => {
    const f = e.target.files[0];
    if (f) f.text().then((t) => analyze(t, 'Your dataset'));
  });

  // ---- To-do (localStorage) ----
  let todos = [];
  try { todos = JSON.parse(localStorage.getItem('todos') || '[]'); } catch (e) {}
  const save = () => { try { localStorage.setItem('todos', JSON.stringify(todos)); } catch (e) {} };
  function renderTodos() {
    const done = todos.filter((t) => t.done).length;
    $('todo-count').textContent = `${todos.length - done} remaining · ${done} completed`;
    $('todo-list').innerHTML = todos.length ? '' : '<li class="note">No tasks yet. Add your first task above.</li>';
    todos.forEach((t, i) => {
      const li = document.createElement('li');
      if (t.done) li.className = 'done';
      li.innerHTML = `<input type="checkbox" ${t.done ? 'checked' : ''} aria-label="Complete task" style="width:auto;margin:0"><span>${esc(t.text)}</span><button class="link" type="button">Delete</button>`;
      li.querySelector('input').addEventListener('change', () => { t.done = !t.done; save(); renderTodos(); });
      li.querySelector('button').addEventListener('click', () => { todos.splice(i, 1); save(); renderTodos(); });
      $('todo-list').appendChild(li);
    });
  }
  $('todo-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const v = $('todo-input').value.trim();
    if (!v) return;
    todos.push({text: v, done: false});
    $('todo-input').value = '';
    save(); renderTodos();
  });
  renderTodos();

  // ---- Contact form -> mailto ----
  $('contact-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const body = `${$('c-msg').value}\n\nFrom: ${$('c-name').value} (${$('c-email').value})`;
    location.href = `mailto:karthik14235600@fmail.com?subject=${encodeURIComponent('Portfolio message from ' + $('c-name').value)}&body=${encodeURIComponent(body)}`;
  });
})();
