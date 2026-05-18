import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Calendar, User, Clock, Share2 } from 'lucide-react';
import { motion } from 'motion/react';

const articles = {
  '1': {
    title: 'Top 5 Study Techniques for Class 12 Boards in 2026',
    author: 'EduExpert',
    date: 'May 15, 2026',
    readTime: '6 min read',
    content: `
      <p>Mastering the Class 12 Board exams requires a strategic shift from pure hard work to "smart work." In 2026, the curriculum has evolved to focus more on <strong>competency-based questions</strong>. Here are the top 5 techniques used by toppers this year.</p>
      
      <h3>1. The Pomodoro Technique with a Twist</h3>
      <p>Standard 25-minute sprints might be too short for complex Physics derivations. We recommend 50-minute deep work sessions followed by a 10-minute "Tech-Free" break. During these breaks, avoid your phone entirely; instead, try light stretching or hydration.</p>
      
      <h3>2. Active Recall via Lightning Quizzes</h3>
      <p>Instead of re-reading your notes, close the book and ask yourself: "What are the three main factors affecting this reaction?" This active retrieval of information strengthens neural pathways far better than passive reading.</p>
      
      <h3>3. Spaced Repetition Schedules</h3>
      <p>Combat the "Forgetting Curve." Review a chapter 24 hours after learning it, then 1 week later, then 1 month later. Our platform's dashboard helps you track these revision cycles automatically.</p>
      
      <h3>4. Interleaving Practice</h3>
      <p>Don't just study one subject all day. Spend 2 hours on Math, then switch to English, then back to Chemistry. This prevents "cognitive saturation" and keeps your brain alert to new patterns.</p>
      
      <h3>5. Mind Mapping for Macro-Understanding</h3>
      <p>Use visual hierarchies to see how individual topics connect to the larger unit. This is vital for subjects like Biology and History where the "big picture" is as important as the details.</p>
    `
  },
  '2': {
    title: 'Building a Revision Schedule That Actually Works',
    author: 'NotesAdda Team',
    date: 'May 12, 2026',
    readTime: '8 min read',
    content: `
      <p>The most common mistake students make is creating a "perfect" schedule that is impossible to follow. A schedule that breaks on day one leads to guilt, and guilt leads to more procrastination.</p>
      
      <h3>Step 1: The Circadian Rhythm Audit</h3>
      <p>Identify when you are most alert. Are you a "Morning Lark" or a "Night Owl"? Schedule your toughest subjects—usually Math or Physics—during your peak alertness windows.</p>
      
      <h3>Step 2: The Buffer Zone Method</h3>
      <p>Never pack your day 100%. Leave at least 90 minutes of "Buffer Time" every evening to catch up on topics that took longer than expected. If you finish ahead of time, this becomes your reward time.</p>
      
      <h3>Step 3: Clean Breaks vs. Dirty Breaks</h3>
      <p>A clean break is one where you step away from screens. A dirty break (scrolling social media) actually fatigues your eyes and focus further. Aim for 15 minutes of movement for every 90 minutes of study.</p>
    `
  },
  '3': {
    title: 'Visual Learning: Why Mind Maps Are Your Memory\'s Best Friend',
    author: 'ScholarPath',
    date: 'May 10, 2026',
    readTime: '5 min read',
    content: `
      <p>The human brain processes visual information 60,000 times faster than text. Using Mind Maps isn't just a "creative" choice; it's a physiological hack for better memory retention.</p>
      
      <h3>The Science of Dual Coding</h3>
      <p>When you use both words and images to represent a concept, you create two separate memory traces in your brain. If you forget the word during an exam, the visual image of the mind map in your mind often triggers the recovery of the text.</p>
      
      <h3>How to Use Notes Adda Mind Maps</h3>
      <p>Our mind maps are color-coded by importance. Red nodes represent core definitions, while blue nodes represent secondary applications. Review these first thing in the morning to prime your brain for deep study.</p>
    `
  },
  '4': {
    title: 'Staying Motivated During the Long Exam Season',
    author: 'MindsetCoach',
    date: 'May 08, 2026',
    readTime: '7 min read',
    content: `
      <p>Motivation is a feeling, but success is a system. You cannot rely on "grit" alone to get through a 2-month long board exam season. You need a dopamine-friendly study routine.</p>
      
      <h3>The Power of Micro-Goals</h3>
      <p>Don't aim to "finish Biology." Aim to "solve 5 genetics problems." Every time you tick off a micro-goal, your brain releases a small burst of dopamine, which fuels your motivation for the next task.</p>
      
      <h3>Managing Exam Anxiety</h3>
      <p>Anxiety is often just "unpreparedness" disguised as fear. Use our mock tests to normalize the exam environment. The more "surprises" you eliminate beforehand, the calmer you will be on the actual d-day.</p>
    `
  }
};

export default function ArticleDetail() {
  const { id } = useParams<{ id: string }>();
  const article = articles[id as keyof typeof articles];

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto py-24 px-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Article not found</h1>
        <Link to="/articles" className="text-indigo-600 font-bold hover:underline">Return to all articles</Link>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8"
    >
      <Link to="/articles" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 mb-8 transition-colors">
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Articles
      </Link>

      <article className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="p-8 md:p-12">
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-8 pb-8 border-b border-gray-50 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-indigo-600" />
              <span className="font-bold text-gray-900 dark:text-gray-100">{article.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {article.date}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {article.readTime}
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-gray-100 mb-10 leading-tight">
            {article.title}
          </h1>

          <div 
            className="prose prose-lg prose-indigo dark:prose-invert max-w-none 
              prose-headings:font-black prose-headings:tracking-tight 
              prose-p:leading-relaxed prose-p:text-gray-600 dark:prose-p:text-gray-400
              prose-li:text-gray-600 dark:prose-li:text-gray-400
              prose-strong:text-indigo-600 dark:prose-strong:text-indigo-400"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          <div className="mt-16 pt-12 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-6">
            <div className="space-y-1">
              <h4 className="font-bold text-gray-900 dark:text-gray-100">Enjoyed this article?</h4>
              <p className="text-sm text-gray-500">Share it with your fellow students.</p>
            </div>
            <div className="flex gap-4">
              <button className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-colors">
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </article>

      <div className="mt-12 bg-indigo-600 rounded-3xl p-8 md:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-2">
          <h3 className="text-2xl font-bold">Ready to apply these techniques?</h3>
          <p className="text-indigo-100">Get our curated notes and start your journey to success.</p>
        </div>
        <Link to="/notes" className="px-8 py-4 bg-white text-indigo-600 font-black rounded-2xl hover:bg-indigo-50 transition-all shadow-xl shadow-indigo-900/20">
          Browse Notes
        </Link>
      </div>
    </motion.div>
  );
}
