import { Op, Sequelize } from "sequelize";
import AppError from "../../errors/AppError";
import UserQueue from "../../models/UserQueue";
import Queue from "../../models/Queue";

const ListUserQueueServices = async (queueId: string | number): Promise<UserQueue> => {
    // Buscar a fila para verificar o tipo de roteamento
    const queue = await Queue.findByPk(queueId);
    
    if (!queue) {
        throw new AppError("ERR_QUEUE_NOT_FOUND", 404);
    }

    let orderClause;
    
    if (queue.typeRandomMode === "ORDENADO") {
        // Para roteamento ordenado, usar ordem por ID
        orderClause = [["id", "ASC"]];
    } else {
        // Para roteamento random, usar random()
        orderClause = Sequelize.literal('random()');
    }

    const userQueue = await UserQueue.findOne({
        where: {
            queueId: {
                [Op.or]: [queueId]
            }
        },
        order: orderClause
    });

    if (!userQueue) {
        throw new AppError("ERR_NOT_FOUND_USER_IN_QUEUE", 404);
    }

    return userQueue;
};

export default ListUserQueueServices;
