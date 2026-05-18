import React from 'react';
import { Book, Clock, Trophy, ChevronRight, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const articles = [
  {
    id: '1',
    title: 'Top 5 Study Techniques for Class 12 Boards in 2026',
    summary: 'Mastering the boards requires more than just long hours at your desk. In 2026, the exam pattern favors conceptual clarity over rote memorization. Learn how to implement the Pomodoro technique for better focus, active recall for testing yourself, and spaced repetition to move information from short-term to long-term memory. We also discuss how to handle the pressure of being in the "topper" bracket.',
    date: 'May 15, 2026',
    author: 'EduExpert',
    readTime: '6 min read',
    icon: <Clock className="h-6 w-6 text-indigo-600" />
  },
  {
    id: '2',
    title: 'Building a Revision Schedule That Actually Works',
    summary: 'A poorly planned schedule is the fastest way to burnout and academic fatigue. Most students fail because they don\'t account for downtime and subject fatigue. In this deep dive, we show you how to structure your day according to your circadian rhythm, why you should study "hard" subjects in the morning, and the importance of taking "clean breaks" without digital distractions. Download our free schedule template inside.',
    date: 'May 12, 2026',
    author: 'NotesAdda Team',
    readTime: '8 min read',
    icon: <Book className="h-6 w-6 text-green-600" />
  },
  {
    id: '3',
    title: 'Visual Learning: Why Mind Maps Are Your Memory\'s Best Friend',
    summary: 'Science proves that visual data is processed 60,000 times faster than text. For subjects like Biology and History where connections between concepts are vital, traditional flat notes often fall short. Explore the power of Mind Maps in your revision strategy. We explain the "Dual Coding Theory" and provide step-by-step instructions on how to use our pre-made mind maps to simplify complex chapters into single-page visual hubs.',
    date: 'May 10, 2026',
    author: 'ScholarPath',
    readTime: '5 min read',
    icon: <Trophy className="h-6 w-6 text-orange-600" />
  },
  {
    id: '4',
    title: 'Staying Motivated During the Long Exam Season',
    summary: 'Motivation is a finite resource. When you have months of exams ahead, you need systems, not just "grit." This article explores the psychology of motivation, the role of dopamine in study habits, and how to set "micro-goals" to keep yourself rewarded. We also touch upon the importance of social support and knowing when to take a mental health day to prevent long-term burnout.',
    date: 'May 08, 2026',
    author: 'MindsetCoach',
    readTime: '7 min read',
    icon: <Zap className="h-6 w-6 text-yellow-600" />
  }
];

export default function Articles() {
  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight sm:text-5xl">
          Study Insights & Articles
        </h1>
        <p className="mt-4 text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
          Expert advice, study tips, and educational news to help you stay ahead in your academic journey.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {articles.map((article) => (
          <div key={article.id} className="flex flex-col bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-xl transition-all group">
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl group-hover:scale-110 transition-transform">
                  {article.icon}
                </div>
                <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                  {article.author}
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 group-hover:text-indigo-600 transition-colors">
                {article.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
                {article.summary}
              </p>
              <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-50 dark:border-gray-800">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>{article.date}</span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full" />
                  <span>{article.readTime}</span>
                </div>
                <Link to={`/articles/${article.id}`} className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full transition-colors">
                  <ChevronRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Structured Content Block for AdSense */}
      <section className="mt-24 p-8 md:p-12 bg-indigo-600 rounded-3xl text-white">
        <div className="max-w-4xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold">Empowering Students Through Quality Content</h2>
          <p className="text-indigo-100 text-lg leading-relaxed">
            At Notes Adda, our mission extends beyond providing digital products. We strive to be a comprehensive educational resource. Our editorial team works tirelessly to produce articles that address the psychological and practical aspects of learning.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-indigo-500">
            <div>
              <h3 className="text-xl font-bold mb-4">Evidence-Based Techniques</h3>
              <p className="text-indigo-100">
                We dive deep into cognitive science to bring you study methods that are backed by research. From memory palace techniques to dual coding, we make complex learning theories easy to implement in your daily schedule.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Mental Well-being</h3>
              <p className="text-indigo-100">
                Academic success is not just about grades; it's about balance. Our articles provide guidance on managing exam stress, maintaining physical health during finals, and developing a growth mindset.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
