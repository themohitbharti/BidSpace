import { Router } from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import { User , UserDocument} from "../models/user.models";

const router = Router();

router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));


router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/' }), async (req, res) => {
    const user = req.user as UserDocument;

    if (!user) {       
        return res.status(404).json({
            success: false,
            message:"user not defined"
        });
    }

    // Generate access and refresh tokens
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    // Store the refresh token in the database
    user.refreshToken = refreshToken;
    await user.save();

    // Set the tokens as HTTP-only cookies
    res.cookie('accessToken', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

    res.redirect('/'); // Redirect to the home page or any other route
});

export default router;