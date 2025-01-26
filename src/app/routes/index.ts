import { Router } from "express";
// import { userRoute } from "../modules/user/user.routes";
import { visaRoutes } from "../modules/visa/visa.routes";

const router = Router();

const moduleRoutes = [
    {
        path: "/visa",
        route: visaRoutes
    }
]

moduleRoutes.forEach(({ path, route }) => {
    router.use(path, route);
});

export default router;