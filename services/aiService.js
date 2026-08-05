const express = require('express');
const Joi = require('joi');
const natural = require('natural');
const validate = require('../middleware/validate');
const router = express.Router();

const tokenizer = new natural.WordTokenizer();

// Sentiment analysis
const analyzeSentiment = (text) => {
  const positive = ['خوب', 'عالی', 'مثبت', 'خوشحال', 'عشق', 'عالیه', 'بهترین', 'فوقالعاده', 'شاد'];
  const negative = ['بد', 'ضعیف', 'منفی', 'غمگین', 'ناراحت', 'افتضاح', 'بدترین'];
  const lower = text.toLowerCase();
  let score = 0;
  positive.forEach(w => { if (lower.includes(w)) score++; });
  negative.forEach(w => { if (lower.includes(w)) score--; });
  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
};

// Text classification
const classifyText = (text) => {
  const categories = {
    ورزشی: ['فوتبال', 'ورزش', 'بازی', 'تیم'],
    فناوری: ['هوش مصنوعی', 'فناوری', 'کامپیوتر', 'برنامه'],
    سلامت: ['بیماری', 'درمان', 'پزشک', 'سلامت'],
    سیاسی: ['دولت', 'مجلس', 'انتخابات', 'سیاست'],
  };
  const lower = text.toLowerCase();
  for (const [cat, keywords] of Object.entries(categories)) {
    if (keywords.some(w => lower.includes(w))) return cat;
  }
  return 'عمومی';
};

// Extractive summarization (simple)
const summarizeText = (text, numSentences = 2) => {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  if (sentences.length <= numSentences) return text;
  const wordFreq = {};
  const words = tokenizer.tokenize(text.toLowerCase());
  words.forEach(w => { wordFreq[w] = (wordFreq[w] || 0) + 1; });
  const sentenceScores = sentences.map(s => {
    const tokens = tokenizer.tokenize(s.toLowerCase());
    return tokens.reduce((sum, t) => sum + (wordFreq[t] || 0), 0) / tokens.length;
  });
  const ranked = sentences.map((s, i) => ({ s, score: sentenceScores[i] }))
    .sort((a, b) => b.score - a.score);
  return ranked.slice(0, numSentences).map(r => r.s).join(' ');
};

// Language detection (simple heuristic)
const detectLanguage = (text) => {
  const persianRegex = /[؀-ۿ]/;
  return persianRegex.test(text) ? 'fa' : 'en';
};

const textSchema = Joi.object({ text: Joi.string().trim().min(1).max(5000).required() });
const summarizeSchema = Joi.object({
  text: Joi.string().trim().min(1).max(5000).required(),
  sentences: Joi.number().integer().min(1).max(5).default(2)
});

router.post('/sentiment', validate(textSchema), (req, res) => {
  const sentiment = analyzeSentiment(req.body.text);
  res.json({ success: true, module: 'ai', action: 'sentiment', data: { text: req.body.text, sentiment } });
});

router.post('/classify', validate(textSchema), (req, res) => {
  const category = classifyText(req.body.text);
  res.json({ success: true, module: 'ai', action: 'classify', data: { text: req.body.text, category } });
});

router.post('/summarize', validate(summarizeSchema), (req, res) => {
  const summary = summarizeText(req.body.text, req.body.sentences);
  res.json({ success: true, module: 'ai', action: 'summarize', data: { original_length: req.body.text.length, summary } });
});

router.post('/detect-language', validate(textSchema), (req, res) => {
  const lang = detectLanguage(req.body.text);
  res.json({ success: true, module: 'ai', action: 'detect-language', data: { text: req.body.text, language: lang } });
});

module.exports = router;