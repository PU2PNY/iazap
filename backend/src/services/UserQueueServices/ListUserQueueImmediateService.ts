import { Op, Sequelize } from "sequelize";
import AppError from "../../errors/AppError";
import UserQueue from "../../models/UserQueue";
import Queue from "../../models/Queue";
import User from "../../models/User";
import Ticket from "../../models/Ticket";

interface ImmediateRandomizationResult {
  userId: number | null;
  userQueue: UserQueue | null;
  isImmediate: boolean;
}

const ListUserQueueImmediateService = async (
  queueId: string | number,
  ticketId?: number
): Promise<ImmediateRandomizationResult> => {
  // Buscar a fila com as configurações
  const queue = await Queue.findByPk(queueId, {
    include: [
      {
        model: User,
        as: "users",
        through: { attributes: [] }
      }
    ]
  });

  if (!queue) {
    throw new AppError("ERR_QUEUE_NOT_FOUND", 404);
  }

  // Verificar se a randomização imediata está ativada
  if (!queue.randomizeImmediate || !queue.ativarRoteador) {
    // Usar lógica normal de roteamento
    const userQueue = await UserQueue.findOne({
      where: {
        queueId: {
          [Op.or]: [queueId]
        }
      },
      order: queue.typeRandomMode === "ORDENADO" 
        ? [["id", "ASC"]] 
        : Sequelize.literal('random()')
    });

    if (!userQueue) {
      throw new AppError("ERR_NOT_FOUND_USER_IN_QUEUE", 404);
    }

    return {
      userId: userQueue.userId,
      userQueue,
      isImmediate: false
    };
  }

  // Lógica de randomização imediata
  const users = queue.users;
  
  if (!users || users.length === 0) {
    throw new AppError("ERR_NO_USERS_IN_QUEUE", 404);
  }

  // Filtrar usuários que não têm tickets pendentes ou em atendimento
  const availableUsers = [];
  const availableOnlineUsers = [];
  
  for (const user of users) {
    // Excluir usuários admin
    if (user.profile === "admin") {
      continue;
    }

    const activeTickets = await Ticket.count({
      where: {
        userId: user.id,
        status: {
          [Op.in]: ["open", "pending"]
        },
        companyId: queue.companyId
      }
    });

    if (activeTickets === 0) {
      availableUsers.push(user);
      
      // Verificar se o usuário está online
      if (user.online === true) {
        availableOnlineUsers.push(user);
      }
    }
  }

  // Priorizar usuários online, se não houver, usar todos os disponíveis
  let usersToChooseFrom = availableOnlineUsers.length > 0 ? availableOnlineUsers : availableUsers;

  // Se não há usuários disponíveis, retornar sem usuário (ticket fica na fila)
  if (usersToChooseFrom.length === 0) {
    console.log(`[IMMEDIATE RANDOMIZATION] Nenhum usuário disponível para fila ${queueId}, ticket ficará na fila`);
    return {
      userId: null,
      userQueue: null,
      isImmediate: true
    };
  }

  // Selecionar usuário aleatório
  const randomIndex = Math.floor(Math.random() * usersToChooseFrom.length);
  const selectedUser = usersToChooseFrom[randomIndex];

  // Buscar o UserQueue correspondente
  const userQueue = await UserQueue.findOne({
    where: {
      queueId: queueId,
      userId: selectedUser.id
    }
  });

  if (!userQueue) {
    throw new AppError("ERR_USER_QUEUE_NOT_FOUND", 404);
  }

  return {
    userId: selectedUser.id,
    userQueue,
    isImmediate: true
  };
};

export default ListUserQueueImmediateService;
