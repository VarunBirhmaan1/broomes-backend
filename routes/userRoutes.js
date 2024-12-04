const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../db');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

router.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, email, username, password } = req.body; 

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'Email or username already exists!' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            firstName,
            lastName,
            email,
            username,
            password: hashedPassword,
        });

        const savedUser =  await newUser.save();

       const token = jwt.sign({ id: savedUser._id }, JWT_SECRET, { expiresIn: '1h' });

       res.status(201).json({
           message: 'User registered successfully!',
           user: {
               id: savedUser._id,
               firstName: savedUser.firstName,
               lastName: savedUser.lastName,
               email: savedUser.email,
               username: savedUser.username,
           },
           token,
       });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User is not registered!' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid password!' });
        }

        const token = jwt.sign(
            { id: user._id, username: user.username },
            JWT_SECRET, 
            { expiresIn: '1h' } 
        );

        res.status(200).json({
            message: 'Login successful!',
            token: token,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
