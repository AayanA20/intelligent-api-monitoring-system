import {
  ShieldCheck, Database, Cpu, Globe, GraduationCap, Target,
} from 'lucide-react'
import ChartCard from '../components/ChartCard'

export default function About() {
  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">About This Project</h1>
        <p className="text-slate-400 mt-1">
          Intelligent API Usage Monitoring and Abuse Behavior Detection System
        </p>
      </header>

      <div className="card border-brand/30 bg-gradient-to-br from-brand/10 via-bg-card to-bg-card">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand to-purple-600 flex items-center justify-center glow flex-shrink-0">
            <ShieldCheck className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">API Guardian</h2>
            <p className="text-slate-300 leading-relaxed">
              A full-stack system that monitors every API request, analyzes user behavior
              in real time, and detects abuse patterns that traditional rate-limiting misses
              — like endpoint looping, expensive-API abuse, and bot-like access.
              Combines a <strong>rule engine</strong> with an <strong>LSTM deep-learning model</strong>
              {' '}trained on the ATRDF 2023 dataset to classify traffic as ALLOW, WARN, SLOW, or BLOCK.
            </p>
          </div>
        </div>
      </div>

      <ChartCard title="The problem we solve" subtitle="Why traditional rate-limiting isn't enough">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <Item icon={Target} title="Request count ≠ abuse"
                text="A user calling an expensive endpoint 6 times can hurt the system more than another user calling a cheap one 100 times." />
          <Item icon={Target} title="Static thresholds fail at scale"
                text="The right limit depends on endpoint cost, user history, and behavior context — not a fixed number." />
          <Item icon={Target} title="Bots mimic humans"
                text="Automated scripts blend in with small request counts but uniform, machine-like timing patterns." />
          <Item icon={Target} title="No behavioral visibility"
                text="Developers rarely see HOW their APIs are used — only counts. We expose the patterns." />
        </div>
      </ChartCard>

      <ChartCard title="Detection pipeline" subtitle="Every request passes through 5 stages">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <Stage n={1} title="Capture"   text="Spring interceptor logs endpoint, user, IP, timing." />
          <Stage n={2} title="Persist"   text="PostgreSQL stores every request + every flagged event." />
          <Stage n={3} title="Rule Engine" text="Detects looping, expensive calls, bot-like patterns." />
          <Stage n={4} title="ML Score"  text="LSTM scores behavioral sequences for anomalies." />
          <Stage n={5} title="Respond"   text="Decides: ALLOW · WARN · SLOW · BLOCK." />
        </div>
      </ChartCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard title="Tech Stack">
          <div className="space-y-3">
            <StackItem icon={Globe}    label="Backend"  text="Java 17 · Spring Boot · Spring Security · JWT" />
            <StackItem icon={Database} label="Database" text="PostgreSQL · Spring Data JPA · Hibernate" />
            <StackItem icon={Cpu}      label="ML Service" text="Python · FastAPI · PyTorch · LSTM" />
            <StackItem icon={Globe}    label="Frontend" text="React 18 · Vite · Tailwind · Recharts" />
          </div>
        </ChartCard>

        <ChartCard title="ML Model">
          <div className="space-y-3 text-sm">
            <Row k="Architecture"     v="2-layer LSTM · hidden dim 64" />
            <Row k="Output"           v="Sigmoid → binary classification" />
            <Row k="Loss"             v="Weighted binary cross-entropy" />
            <Row k="Early stopping"   v="On validation F1 score" />
            <Row k="Training dataset" v="ATRDF 2023 · Cisco × Ariel" />
            <Row k="Features"         v="Request frequency · endpoint diversity · temporal sequences" />
            <Row k="Accuracy"         v={<span className="text-success font-bold">86.4%</span>} />
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Team" subtitle="Minor Project · PR1103 · JK Lakshmipat University">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Member name="Keerti Shekhawat" id="2023btech042" role="Machine Learning" />
          <Member name="Aayan Ansari"     id="2023btech103" role="Cybersecurity"   />
          <Member name="Harshita Khandelwal" id="2024btech351" role="Backend"       />
        </div>
        <div className="mt-6 flex items-center gap-3 text-sm text-slate-400 border-t border-slate-800 pt-4">
          <GraduationCap className="w-4 h-4" />
          Faculty Supervisor: <span className="text-slate-200 font-medium">Prof. Devendra Bhavsar</span>
          <span className="text-slate-600">·</span>
          Department of Computer Science Engineering
        </div>
      </ChartCard>
    </div>
  )
}

function Item({ icon: Icon, title, text }) {
  return (
    <div className="flex gap-3 p-3 rounded-lg bg-bg-soft border border-slate-800/60">
      <Icon className="w-4 h-4 text-brand-light flex-shrink-0 mt-0.5" />
      <div>
        <h4 className="font-semibold text-slate-100 mb-1">{title}</h4>
        <p className="text-slate-400">{text}</p>
      </div>
    </div>
  )
}

function Stage({ n, title, text }) {
  return (
    <div className="p-4 rounded-xl bg-bg-soft border border-slate-800/60 relative overflow-hidden">
      <div className="absolute top-2 right-3 text-5xl font-black text-slate-800/50">{n}</div>
      <h4 className="font-semibold text-slate-100 relative">{title}</h4>
      <p className="text-xs text-slate-500 mt-1 relative">{text}</p>
    </div>
  )
}

function StackItem({ icon: Icon, label, text }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="w-9 h-9 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-brand-light" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">{label}</p>
        <p className="text-sm text-slate-200">{text}</p>
      </div>
    </div>
  )
}

function Row({ k, v }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-800/40 last:border-0">
      <span className="text-slate-500">{k}</span>
      <span className="text-slate-200 mono text-xs">{v}</span>
    </div>
  )
}

function Member({ name, id, role }) {
  return (
    <div className="p-4 rounded-xl bg-bg-soft border border-slate-800/60 text-center">
      <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-brand to-purple-600 flex items-center justify-center text-lg font-bold">
        {name.split(' ').map(n => n[0]).join('').slice(0, 2)}
      </div>
      <h4 className="font-semibold text-slate-100">{name}</h4>
      <p className="text-xs mono text-slate-500 mt-0.5">{id}</p>
      <p className="text-xs text-brand-light mt-2 font-semibold uppercase tracking-wider">{role}</p>
    </div>
  )
}