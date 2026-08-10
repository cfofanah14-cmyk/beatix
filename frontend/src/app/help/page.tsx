'use client'
import { useState } from 'react'

const FAQS = [
  { id:'1', cat:'Tickets', q:'How do I get my ticket after paying?', a:'Your QR code ticket is delivered instantly via SMS and appears in My Tickets.' },
  { id:'2', cat:'Tickets', q:'Can I transfer my ticket to someone else?', a:'Ticket transfers are not yet supported. Your ticket is tied to your phone number.' },
  { id:'3', cat:'Payments', q:'What payment methods are accepted?', a:'We accept Afrimoney, Orange Money, and debit/credit cards via Flutterwave.' },
  { id:'4', cat:'Payments', q:'How do I get a refund?', a:'Refunds are handled by the event organizer. Contact them directly or report the issue.' },
  { id:'5', cat:'Account', q:'How do I reset my phone number?', a:'Go to Profile, then Settings, then Change Phone. A new OTP will be sent.' },
  { id:'6', cat:'Scanning', q:'My QR code will not scan at the door. What do I do?', a:'Increase your screen brightness and show the full QR code. Staff can enter your ticket code manually.' },
  { id:'7', cat:'Events', q:'How do I list an event on Beatix?', a:'Sign up as an Organizer, create your profile, then tap Create Event from your dashboard.' },
]

export default function HelpPage() {
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('All')
  const [open, setOpen] = useState('')
  const cats = ['All', 'Tickets', 'Payments', 'Account', 'Scanning', 'Events']
  const filtered = FAQS.filter(f => {
    if (cat !== 'All' && f.cat !== cat) return false
    if (search && !f.q.toLowerCase().includes(search.toLowerCase()) && !f.a.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })
  return (
    <div style={{fontFamily:'DM Sans,sans-serif',background:'#0D0B2B',minHeight:'100vh',color:'#fff',maxWidth:480,margin:'0 auto',padding:'40px 20px 60px'}}>
      <div style={{fontFamily:'Syne,sans-serif',fontSize:24,fontWeight:800,marginBottom:4}}>Help Center</div>
      <div style={{fontSize:14,color:'rgba(255,255,255,0.45)',marginBottom:20}}>How can we help you today?</div>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search for help..." style={{width:'100%',background:'#1A1845',border:'1px solid rgba(255,255,255,0.1)',borderRadius:12,padding:'13px 14px',color:'#fff',fontSize:14,outline:'none',boxSizing:'border-box',marginBottom:16}}/>
      <div style={{display:'flex',gap:8,overflowX:'auto',marginBottom:20,paddingBottom:4}}>
        {cats.map(c=>(
          <button key={c} onClick={()=>setCat(c)} style={{flexShrink:0,background:cat===c?'#6B2FA0':'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:20,padding:'7px 14px',color:cat===c?'#fff':'rgba(255,255,255,0.5)',fontSize:12,cursor:'pointer'}}>
            {c}
          </button>
        ))}
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {filtered.length===0?(
          <div style={{textAlign:'center',padding:'40px 0',color:'rgba(255,255,255,0.3)',fontSize:14}}>No results found. Try different keywords.</div>
        ):filtered.map(f=>(
          <div key={f.id} style={{background:'#13113A',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,overflow:'hidden'}}>
            <button onClick={()=>setOpen(open===f.id?'':f.id)} style={{width:'100%',background:'none',border:'none',padding:16,display:'flex',justifyContent:'space-between',alignItems:'center',color:'#fff',cursor:'pointer',textAlign:'left',gap:12}}>
              <span style={{fontFamily:'Syne,sans-serif',fontSize:14,fontWeight:600,lineHeight:1.4}}>{f.q}</span>
              <span style={{color:'#A855D4',fontSize:18,flexShrink:0}}>{open===f.id?'^':'v'}</span>
            </button>
            {open===f.id&&(
              <div style={{padding:'0 16px 16px',fontSize:14,color:'rgba(255,255,255,0.6)',lineHeight:1.65,borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:14}}>
                {f.a}
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{margin:'32px 0 0',background:'rgba(107,47,160,0.15)',border:'1px solid rgba(107,47,160,0.3)',borderRadius:16,padding:20,textAlign:'center'}}>
        <div style={{fontSize:14,color:'rgba(255,255,255,0.5)',marginBottom:12}}>Still need help?</div>
        <a href="/report" style={{display:'inline-block',background:'#F5C842',color:'#0D0B2B',borderRadius:12,padding:'11px 24px',fontFamily:'Syne,sans-serif',fontSize:14,fontWeight:700,textDecoration:'none'}}>Report a Problem</a>
      </div>
    </div>
  )
}
