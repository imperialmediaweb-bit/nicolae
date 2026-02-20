"use client";

import AppLayout from "@/components/AppLayout";
import Link from "next/link";
import { useState } from "react";

interface Section {
  id: string;
  title: string;
  icon: string;
  color: string;
  items: { title: string; desc: string }[];
}

const sections: Section[] = [
  {
    id: "login",
    title: "Autentificare",
    icon: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z",
    color: "bg-gray-100 text-gray-600",
    items: [
      { title: "Acces aplicatie", desc: "Deschide aplicatia si introdu numele de utilizator si parola. Dupa autentificare vei fi redirectionat catre pagina principala." },
      { title: "Cont implicit", desc: "Contul implicit este: utilizator \"admin\", parola \"admin123\". Acest cont are acces complet la toate functionalitatile." },
      { title: "Initializare date", desc: "La prima utilizare, apasa \"Initializare date demo\" pe pagina de login pentru a popula categoriile de medicamente si contul." },
    ],
  },
  {
    id: "dashboard",
    title: "Pagina principala",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    color: "bg-indigo-100 text-indigo-600",
    items: [
      { title: "Statistici rapide", desc: "Aici vezi numarul total de beneficiari, note de orientare si medicamente inregistrate." },
      { title: "Alerte stoc", desc: "Daca exista medicamente cu stoc sub pragul minim, vei vedea un banner portocaliu cu lista lor." },
      { title: "Actiuni rapide", desc: "Butoane directe catre: adaugare medicament, creare nota de orientare, chat AI, beneficiari, rapoarte PDF." },
      { title: "Sectiune Admin", desc: "Ai acces la gestionarea utilizatorilor si setarile API (chei Anthropic, Gemini, Twilio)." },
    ],
  },
  {
    id: "beneficiari",
    title: "Beneficiari (Persoane)",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    color: "bg-blue-100 text-blue-600",
    items: [
      { title: "Lista beneficiari", desc: "Pagina \"Persoane\" afiseaza toti beneficiarii inregistrati. Poti cauta dupa nume sau cod si filtra dupa statut (fara adapost, centru, familie)." },
      { title: "Adauga beneficiar nou", desc: "Apasa \"+ Adauga beneficiar\" si completeaza formularul in 3 pasi: Date de baza (cod, nume, varsta, sex, GDPR) > Situatie sociala (familie, locuinta, institutionalizare) > Status medical (boli, medicatie, dizabilitati)." },
      { title: "Profil beneficiar", desc: "Apasa pe un beneficiar pentru a vedea profilul complet: date personale, istoricul medical, situatia familiala si lista tuturor notelor de orientare." },
      { title: "Actiuni pe profil", desc: "Din profil poti: crea o nota de orientare noua, genera raport PDF, sau edita datele beneficiarului." },
    ],
  },
  {
    id: "evaluari",
    title: "Note de orientare",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    color: "bg-purple-100 text-purple-600",
    items: [
      { title: "Ce sunt notele", desc: "Notele de orientare sunt evaluari standardizate ale beneficiarilor, care includ observatii comportamentale si starea emotionala. Dupa salvare, AI-ul genereaza automat un raport profesional." },
      { title: "Creare nota noua", desc: "Apasa \"+ Nota noua\" si completeaza 3 pasi: Selecteaza beneficiarul si confirma consimtamantul > Evalueaza comportamentul (comunicare, reactie la stres, sociabilitate, autonomie, somn, apetit) > Evalueaza starea emotionala (tristete, anxietate, furie, apatie, speranta) + observatii." },
      { title: "Raport AI generat", desc: "Dupa salvare, AI-ul creeaza automat un raport cu 6 sectiuni: context personal, profil emotional, nevoi principale, riscuri identificate, recomandari si plan de sprijin." },
      { title: "Descarcare PDF", desc: "Din pagina unei note poti descarca raportul complet in format PDF pentru dosarul beneficiarului." },
    ],
  },
  {
    id: "farmacie",
    title: "Farmacie",
    icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
    color: "bg-green-100 text-green-600",
    items: [
      { title: "Lista medicamente", desc: "Pagina \"Farmacie\" afiseaza toate medicamentele cu stocul curent, colorat pe categorii. Cauta dupa nume sau filtreaza dupa categorie." },
      { title: "Adauga medicament", desc: "Apasa \"+ Medicament nou\" si completeaza: categorie, nume, descriere, dozaj, stoc initial, prag minim de alerta, unitate de masura si data de expirare." },
      { title: "Gestioneaza stoc", desc: "Pe fiecare medicament ai butoane de \"Elibereaza\" (scade stocul) si \"Adauga stoc\" (mareste stocul). La fiecare operatie se cere cantitatea si motivul." },
      { title: "Alerte stoc", desc: "Medicamentele sub pragul minim apar cu indicator rosu. Primesti si notificari automate (banner + clopotel) cand stocul e critic." },
      { title: "Istoric operatii", desc: "Din pagina unui medicament vezi log-ul complet: cine a adaugat/eliberat stoc, cand si de ce. Poti filtra dupa tip de operatie." },
      { title: "AI Insights", desc: "Butonul \"AI Insights\" de pe pagina farmaciei analizeaza stocul si ofera: alerte urgente, tendinte, recomandari de aprovizionare." },
    ],
  },
  {
    id: "chat",
    title: "Chat AI",
    icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
    color: "bg-pink-100 text-pink-600",
    items: [
      { title: "Asistent virtual", desc: "Chat AI este un asistent inteligent care cunoaste datele din aplicatie si te poate ajuta cu intrebari despre beneficiari, medicamente sau proceduri." },
      { title: "Sugestii rapide", desc: "La deschidere vezi sugestii pre-definite: starea stocului, tehnici de de-escaladare, comunicare cu beneficiarii, cum se completeaza o evaluare, scenarii de refuz medicatie." },
      { title: "Configurare", desc: "Chat-ul necesita o cheie API configurata (Anthropic Claude sau Google Gemini). Mergi la Setari pentru a introduce cheia." },
    ],
  },
  {
    id: "rapoarte",
    title: "Rapoarte PDF",
    icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    color: "bg-amber-100 text-amber-600",
    items: [
      { title: "Generare raport", desc: "Selecteaza o nota de orientare din lista si genereaza un raport PDF profesional cu profilul psiho-social al beneficiarului." },
      { title: "Continut raport", desc: "Raportul include: date de identificare, rezumat social, observatii comportamentale, profil emotional, nevoi, riscuri, recomandari si plan de sprijin." },
      { title: "Printare", desc: "Raportul se deschide intr-o fereastra formatata pentru print. Foloseste Ctrl+P (sau butonul de print) pentru a-l salva sau printa." },
    ],
  },
  {
    id: "notificari",
    title: "Notificari",
    icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
    color: "bg-red-100 text-red-600",
    items: [
      { title: "Clopotel", desc: "Iconita de clopotel din dreapta sus arata numarul de alerte active. Apasa pentru a vedea detaliile." },
      { title: "Tipuri de alerte", desc: "Alerte critice (rosu) = stoc zero sau medicament expirat. Alerte de avertizare (portocaliu) = stoc sub minim sau expira curand." },
      { title: "Actiuni", desc: "Pentru fiecare alerta poti: vedea medicamentul direct sau ignora alerta. Butonul \"Ignora toate\" ascunde toate alertele active." },
      { title: "Badge Farmacie", desc: "Numarul de alerte apare si pe iconita \"Farmacie\" din bara de navigare de jos." },
    ],
  },
  {
    id: "admin",
    title: "Administrare",
    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
    color: "bg-slate-100 text-slate-600",
    items: [
      { title: "Gestionare utilizatori", desc: "Din Admin > Utilizatori poti: vedea toti userii, crea conturi noi (cu nume, utilizator, parola, rol), edita datele existente, activa/dezactiva conturi." },
      { title: "Roluri disponibile", desc: "Administrator (acces complet), Psiholog (beneficiari + note), Asistent social (beneficiari + note + eliberare stoc), Farmacist (farmacie + stoc)." },
      { title: "Setari API", desc: "Din Setari poti configura: cheia Anthropic Claude (pentru AI chat si rapoarte), cheia Google Gemini (alternativa AI), Twilio (SID, token, numar, destinatari SMS)." },
      { title: "Statusuri API", desc: "Fiecare cheie API arata statusul: verde = activ, gri = nesetat. Apasa pe camp pentru a modifica cheia." },
    ],
  },
];

export default function GhidPage() {
  const [openSection, setOpenSection] = useState<string | null>(null);

  function toggle(id: string) {
    setOpenSection(openSection === id ? null : id);
  }

  return (
    <AppLayout title="Ghid utilizator" backHref="/dashboard">
      <div className="space-y-4">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-5 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white/20 rounded-2xl p-2.5">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-lg">Ghid complet</h2>
              <p className="text-white/70 text-xs">Toate functionalitatile aplicatiei</p>
            </div>
          </div>
          <p className="text-white/80 text-sm leading-relaxed">
            Apasa pe fiecare sectiune pentru a vedea instructiuni detaliate despre cum sa folosesti Casa Nicolae.
          </p>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Beneficiari", href: "/beneficiari", color: "bg-blue-50 text-blue-600" },
            { label: "Note", href: "/evaluari", color: "bg-purple-50 text-purple-600" },
            { label: "Farmacie", href: "/farmacie", color: "bg-green-50 text-green-600" },
          ].map((link) => (
            <Link key={link.href} href={link.href} className={`${link.color} rounded-2xl p-3 text-center text-xs font-semibold active:scale-95 transition-all`}>
              {link.label}
            </Link>
          ))}
        </div>

        {/* Sections accordion */}
        <div className="space-y-2">
          {sections.map((section) => (
            <div key={section.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <button
                onClick={() => toggle(section.id)}
                className="w-full flex items-center gap-3 p-4 active:bg-gray-50 transition"
              >
                <div className={`${section.color} p-2.5 rounded-xl flex-shrink-0`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={section.icon} />
                  </svg>
                </div>
                <span className="font-semibold text-gray-900 text-sm flex-1 text-left">{section.title}</span>
                <svg className={`w-5 h-5 text-gray-400 transition-transform ${openSection === section.id ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {openSection === section.id && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-50 pt-3">
                  {section.items.map((item, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[11px] font-bold">
                          {i + 1}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                        <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer tip */}
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
          <div className="flex gap-3">
            <div className="bg-amber-100 p-2 rounded-xl flex-shrink-0 h-fit">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-800">Sfat important</p>
              <p className="text-xs text-amber-600 leading-relaxed mt-0.5">
                Pentru a folosi functiile AI (rapoarte automate, chat, insights farmacie), trebuie sa configurezi cel putin o cheie API din pagina de Setari.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
