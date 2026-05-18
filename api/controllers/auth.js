import User from "../models/User.js"
import bcrypt from "bcryptjs"
import { createError } from "../utils/error.js"
import jwt from "jsonwebtoken"

export const login = async (req, res, next) => {
    try {
        const user = await User.findOne({ username: req.body.username })
        if (!user) return next(createError(404, "User not found."))

        const isPasswordCorrect = await bcrypt.compareSync(req.body.password, user.password)
        if (!isPasswordCorrect) return next(createError(400, "Wrong password or username."))

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT)

        const { password, role, ...otehrdetails } = user._doc
        res.cookie("access_token", token, {
            httpOnly: true
        }).status(200).json({ ...otehrdetails })

    } catch (err) {
        next(err)
    }
}