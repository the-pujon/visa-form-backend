import { Router } from "express";
import { userRoute } from "../modules/user/user.routes";

const router = Router();

const moduleRoutes = [
    {
        path: "users",
        route: userRoute
    }
]

moduleRoutes.forEach(({ path, route }) => {
    router.use(path, route);
});

export default router;