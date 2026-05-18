import User from "../models/User.js";
import bcrypt from "bcryptjs"


export const createUser = async (req, res, next) => {
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(req.body.password, salt);
    const newUser = new User({
        username: req.body.username,
        email: req.body.email,
        password: hash,
        role: req.body.role,
        image: req.body.image
    })

    try {
        const saveUser = await newUser.save()
        res.status(200).json(saveUser)
    } catch (err) {
        next(err)
    }
}

export const updateUser = async (req, res, next) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
        res.status(200).json(updatedUser)
    } catch (err) {
        next(err)
    }
}

export const deleteUser = async (req, res, next) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id)
        res.status(200).json(deletedUser)
    } catch (err) {
        next(err)
    }
}

export const getUser = async (req, res, next) => {
    try {
        const getUser = await User.findById(req.params.id)
        res.status(200).json(getUser)
    } catch (err) {
        next(err)
    }
}

export const getAllUser = async (req, res, next) => {
    try {
        const getAllUser = await User.find()
        res.status(200).json(getAllUser)
    } catch (err) {
        next(err)
    }
}