// index for all the routes
import { Router } from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';

const router = Router();

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.post('/users', UsersController.postNew);
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);
router.get('/users/me', UsersController.getMe);
router.get('/files/:id', FilesController.getShow)
router.get('/files', FilesController.getIndex)
router.put('files/:id/publish', FilesController.putPublish)
router.put('/files/:id/publish', FilesController.putUnpublish)
router.get('/files/:id/data', FilesController.getFile)

module.exports = router;
