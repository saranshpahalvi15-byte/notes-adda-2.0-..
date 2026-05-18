import React from 'react';
import { Target, Users, BookOpen, ShieldCheck } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
          About Notes Adda
        </h1>
        <p className="mt-6 text-xl text-gray-500 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
          Empowering the next generation of Indian scholars through high-quality, accessible, and comprehensive study materials.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-24 items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Our Mission</h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed mb-6">
            In the high-pressure environment of Indian competitive exams and Board finals, many students struggle to find organized, clear, and reliable study material. Notes Adda was founded with a single goal: to bridge the gap between classroom learning and self-study.
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
            We specialize in providing Class 9 to 12 students with handwritten and printed PDF notes that are meticulously aligned with the latest CBSE and state board syllabi. Our content is designed not just for reading, but for understanding.
          </p>
        </div>
        <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-2xl shadow-indigo-500/20 rotate-1">
          <div className="grid grid-cols-2 gap-8">
            <div className="text-center space-y-2">
              <div className="text-4xl font-black">50k+</div>
              <p className="text-indigo-100 text-sm">Active Students</p>
            </div>
            <div className="text-center space-y-2">
              <div className="text-4xl font-black">2k+</div>
              <p className="text-indigo-100 text-sm">Study PDFs</p>
            </div>
            <div className="text-center space-y-2">
              <div className="text-4xl font-black">4.9/5</div>
              <p className="text-indigo-100 text-sm">Student Rating</p>
            </div>
            <div className="text-center space-y-2">
              <div className="text-4xl font-black">100%</div>
              <p className="text-indigo-100 text-sm">Syllabus Match</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
        <div className="p-8 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="h-12 w-12 bg-indigo-50 dark:bg-indigo-900/40 rounded-2xl flex items-center justify-center mb-6">
            <Target className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-xl font-bold mb-4">Precision Engineering</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
            Every note, mind map, and mock test is reviewed by subject matter experts to ensure 100% accuracy and relevance to current exam patterns.
          </p>
        </div>
        <div className="p-8 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="h-12 w-12 bg-green-50 dark:bg-green-900/40 rounded-2xl flex items-center justify-center mb-6">
            <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-bold mb-4">Quality & Trust</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
            We prioritize quality over quantity. Our notes use visual cues, diagrams, and clear headings to ensure maximum student retention.
          </p>
        </div>
        <div className="p-8 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="h-12 w-12 bg-purple-50 dark:bg-purple-900/40 rounded-2xl flex items-center justify-center mb-6">
            <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-xl font-bold mb-4">Holistic Learning</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
            From chapters to bundles, mind maps to audio summaries—we provide a complete toolkit for academic excellence.
          </p>
        </div>
      </div>

      <section className="bg-gray-50 dark:bg-gray-800/50 rounded-3xl p-12 text-center">
        <h2 className="text-3xl font-bold mb-8">Ready to boost your grades?</h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="/notes" className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20">
            Explore Study Notes
          </a>
          <a href="/contact" className="px-8 py-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-2xl font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
            Talk to Our Team
          </a>
        </div>
      </section>
    </div>
  );
}
