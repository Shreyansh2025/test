import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import subjectsRouter from "./subjects";
import practiceRouter from "./practice";
import progressRouter from "./progress";
import dashboardRouter from "./dashboard";
import gamificationRouter from "./gamification";
import battlesRouter from "./battles";
import friendsRouter from "./friends";
import notificationsRouter from "./notifications";
import openaiTutorRouter from "./openai-tutor";
import learningPathsRouter from "./learning-paths";
import coursesRouter from "./courses";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(subjectsRouter);
router.use(practiceRouter);
router.use(progressRouter);
router.use(dashboardRouter);
router.use(gamificationRouter);
router.use(battlesRouter);
router.use(friendsRouter);
router.use(notificationsRouter);
router.use(openaiTutorRouter);
router.use(learningPathsRouter);
router.use(coursesRouter);
router.use(aiRouter);

export default router;
