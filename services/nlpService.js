const express = require('express');
const natural = require('natural');
const Joi = require('joi');
const validate = require('../middleware/validate');
const router = express.Router();

const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

const textSchema = Joi.object({ text: Joi.string().trim().min(1).max(5000).required() });

router.post('/tokenize', validate(textSchema), (req, res) => {
  const tokens = tokenizer.tokenize(req.body.text);
  res.json({ success: true, module: 'nlp', action: 'tokenize', data: { tokens, count: tokens.length } });
});

router.post('/stem', validate(textSchema), (req, res) => {
  const tokens = tokenizer.tokenize(req.body.text);
  const stems = tokens.map(t => stemmer.stem(t));
  res.json({ success: true, module: 'nlp', action: 'stem', data: { original: tokens, stems } });
});

router.post('/tfidf', validate(textSchema), (req, res) => {
  const tfidf = new natural.TfIdf();
  tfidf.addDocument(req.body.text);
  const terms = tfidf.listTerms(0).slice(0, 10).map(t => ({ term: t.term, tfidf: t.tfidf }));
  res.json({ success: true, module: 'nlp', action: 'tfidf', data: { terms } });
});

module.exports = router;