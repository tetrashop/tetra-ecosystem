const express = require('express');
const crypto = require('crypto');
const Joi = require('joi');
const fs = require('fs');
const validate = require('../middleware/validate');
const router = express.Router();

const blockchainFile = process.env.BLOCKCHAIN_FILE;

class Block {
  constructor(index, timestamp, data, previousHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
    this.nonce = 0;
  }
  calculateHash() {
    return crypto.createHash('sha256')
      .update(this.index + this.previousHash + this.timestamp + JSON.stringify(this.data) + this.nonce)
      .digest('hex');
  }
  mineBlock(difficulty) {
    while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join('0')) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
  }
}

class Blockchain {
  constructor() {
    this.difficulty = 2;
    this.chain = this.loadChain() || [this.createGenesisBlock()];
    if (this.chain.length === 0) {
      this.chain.push(this.createGenesisBlock());
      this.saveChain();
    }
  }
  createGenesisBlock() { return new Block(0, '01/01/2020', 'Genesis Block', '0'); }
  getLatestBlock() { return this.chain[this.chain.length - 1]; }
  addBlock(newBlock) {
    newBlock.previousHash = this.getLatestBlock().hash;
    newBlock.mineBlock(this.difficulty);
    this.chain.push(newBlock);
    this.saveChain();
  }
  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const curr = this.chain[i], prev = this.chain[i - 1];
      if (curr.hash !== curr.calculateHash()) return false;
      if (curr.previousHash !== prev.hash) return false;
    }
    return true;
  }
  loadChain() {
    try {
      if (fs.existsSync(blockchainFile)) {
        const raw = fs.readFileSync(blockchainFile, 'utf8');
        const data = JSON.parse(raw);
        return data.map(b => {
          const block = new Block(b.index, b.timestamp, b.data, b.previousHash);
          block.hash = b.hash;
          block.nonce = b.nonce;
          return block;
        });
      }
    } catch (e) { /* محیط فقط خواندنی */ }
    return null;
  }
  saveChain() {
    try {
      if (!fs.existsSync(blockchainFile)) {
        // ایجاد فایل در صورت امکان
        fs.mkdirSync(require('path').dirname(blockchainFile), { recursive: true });
      }
      fs.writeFileSync(blockchainFile, JSON.stringify(this.chain, null, 2));
    } catch (e) { /* محیط فقط خواندنی */ }
  }
}

const tetraChain = new Blockchain();
const blockSchema = Joi.object({ data: Joi.string().min(1).max(500).required() });

router.get('/chain', (req, res) => {
  res.json({ success: true, module: 'blockchain', action: 'chain', data: { chain: tetraChain.chain, length: tetraChain.chain.length } });
});
router.post('/mine', validate(blockSchema), (req, res) => {
  const newBlock = new Block(tetraChain.chain.length, new Date().toISOString(), req.body.data);
  tetraChain.addBlock(newBlock);
  res.status(201).json({ success: true, module: 'blockchain', action: 'mine', data: { block: newBlock } });
});
router.get('/validate', (req, res) => {
  const valid = tetraChain.isChainValid();
  res.json({ success: true, module: 'blockchain', action: 'validate', data: { isValid: valid } });
});

module.exports = router;