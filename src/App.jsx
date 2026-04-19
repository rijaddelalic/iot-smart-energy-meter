import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { ref, onValue } from 'firebase/database';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Zap, Activity, Cpu, Coins, Trophy } from 'lucide-react';

function App() {
    const [podaci, setPodaci] = useState({ snaga: 0, struja: 0 });
    const [istorija, setIstorija] = useState([]);
    const [maxPotrosnja, setMaxPotrosnja] = useState({ vrijednost: 0, vrijeme: '--:--:--' });

    // Kalkulacija troškova (BiH tarifa cca 0.168 KM/kWh)
    const cijenaKWh = 0.168;
    const trosakMjesecno = (podaci.snaga / 1000) * 24 * 30 * cijenaKWh;

    useEffect(() => {
        // Uklanjanje margina browsera
        document.body.style.margin = "0";
        document.body.style.padding = "0";
        document.body.style.backgroundColor = "#0f172a";
        document.body.style.overflowX = "hidden";

        const mjerenjaRef = ref(db, 'mjerenja');
        const unsubscribe = onValue(mjerenjaRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setPodaci(data);

                const sad = new Date();
                const vrijemeStr = sad.toLocaleTimeString('hr-HR', {
                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                });

                // Praćenje rekorda (Peak)
                setMaxPotrosnja(prev => {
                    if (data.snaga > prev.vrijednost) {
                        return { vrijednost: data.snaga, vrijeme: vrijemeStr };
                    }
                    return prev;
                });

                // Ažuriranje niza za grafikon
                setIstorija(prev => {
                    const noviNiz = [...prev, { vrijeme: vrijemeStr, snaga: data.snaga }];
                    return noviNiz.slice(-18); // Zadnjih 18 mjerenja na ekranu
                });
            }
        });
        return () => unsubscribe();
    }, []);

    return (
        <div style={{
            backgroundColor: '#0f172a',
            minHeight: '100vh',
            width: '100vw',
            color: 'white',
            fontFamily: "'Segoe UI', Roboto, sans-serif",
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '40px 0'
        }}>
            <div style={{ width: '92%', maxWidth: '1400px' }}>

                {/* Naslov i podaci o studentu */}
                <header style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '15px' }}>
                        <Cpu size={50} color="#38bdf8" />
                        <h1 style={{ margin: 0, fontSize: '3rem', fontWeight: '800', letterSpacing: '-1.5px' }}>
                            SmartEnergy <span style={{ color: '#38bdf8' }}>Monitor</span>
                        </h1>
                    </div>
                    <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '15px 30px', borderRadius: '20px', border: '1px solid #334155', display: 'inline-block' }}>
                        <h2 style={{ color: 'white', margin: 0, fontSize: '1.2rem', fontWeight: '500' }}>
                            Student: <span style={{color: '#38bdf8'}}>Rijad Delalić</span> | IB220051
                        </h2>
                        <p style={{ color: '#64748b', margin: '5px 0 0 0', fontSize: '0.9rem' }}>Dizajn i razvoj IoT projekata</p>
                    </div>
                </header>

                {/* Kartice sa podacima (Analitika) */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '20px',
                    marginBottom: '40px'
                }}>
                    <Card title="TRENUTNA SNAGA" val={podaci.snaga.toFixed(1)} unit="W" icon={<Zap color="#38bdf8" fill="#38bdf8" />} />
                    <Card title="JAČINA STRUJE" val={podaci.struja.toFixed(2)} unit="A" icon={<Activity color="#fbbf24" />} />
                    <Card title="PROCJENA KM / MJ" val={trosakMjesecno.toFixed(2)} unit="KM" icon={<Coins color="#10b981" />} />
                    <Card title="MAKSIMALNI PEAK" val={maxPotrosnja.vrijednost.toFixed(1)} unit="W" icon={<Trophy color="#a855f7" />} subtext={`Zabilježeno u: ${maxPotrosnja.vrijeme}`} />
                </div>

                {/* Glavni grafikon potrošnje */}
                <div style={{
                    background: '#1e293b',
                    padding: '35px',
                    borderRadius: '35px',
                    border: '1px solid #334155',
                    height: '450px',
                    boxShadow: '0 30px 60px rgba(0,0,0,0.5)'
                }}>
                    <h3 style={{ margin: '0 0 30px 0', fontSize: '1.1rem', color: '#94a3b8', fontWeight: '600', letterSpacing: '1px' }}>
                        UŽIVO MONITORING POTROŠNJE (SAT : MIN : SEK)
                    </h3>
                    <ResponsiveContainer width="100%" height="85%">
                        <AreaChart data={istorija} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                            <defs>
                                <linearGradient id="colorSnaga" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="vrijeme" stroke="#64748b" tick={{fill: '#64748b', fontSize: 11}} dy={15} axisLine={false} tickLine={false} />
                            <YAxis stroke="#64748b" tick={{fill: '#64748b', fontSize: 11}} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '15px', color: 'white' }} />
                            <Area type="monotone" dataKey="snaga" stroke="#38bdf8" strokeWidth={4} fillOpacity={1} fill="url(#colorSnaga)" animationDuration={500} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <footer style={{ marginTop: '50px', textAlign: 'center', color: '#475569', fontSize: '0.8rem' }}>
                    Tehnologija: ESP32 (C++) + Firebase Realtime DB + React (Vite)
                </footer>

            </div>
        </div>
    );
}


const Card = ({ title, val, unit, icon, subtext }) => (
    <div style={{ background: 'linear-gradient(145deg, #1e293b, #0f172a)', padding: '30px', borderRadius: '30px', border: '1px solid #334155', boxShadow: '0 15px 30px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
            <span style={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '0.8rem', letterSpacing: '1px' }}>{title}</span>
            {icon}
        </div>
        <div style={{ fontSize: '3rem', fontWeight: '900' }}>
            {val} <span style={{ fontSize: '1.2rem', color: '#475569', fontWeight: '400' }}>{unit}</span>
        </div>
        {subtext && <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '8px' }}>{subtext}</div>}
    </div>
);

export default App;