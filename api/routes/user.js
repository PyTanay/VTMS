import { Router } from "express";
import { createUser, deleteUser, getAllUser, getUser, updateUser } from "../controllers/user.js";
import { verifyToken } from "../utils/verifyToken.js";

const router = Router()
//create
router.post("/", createUser)
//update
router.put("/:id", updateUser)
//delete
router.delete("/:id", deleteUser)
//get

router.get("/isauthenticated", verifyToken, (req, res, next) => {
    res.send("Hello user, you are authenticated")
})
router.get("/:id", getUser)
//getall
router.get("/", getAllUser)

export default router