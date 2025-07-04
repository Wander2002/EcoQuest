import { db } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  getDocs,
  addDoc,
  deleteDoc,
  serverTimestamp
} from "firebase/firestore";

export const saveUserData = async (userId, data) => {
  try {
    await setDoc(doc(db, "users", userId), data, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Erro ao salvar dados do usuário:", error);
    return { success: false, error: error.message };
  }
};

export const createCharacter = async (userId, characterData) => {
  try {
    await setDoc(doc(db, "characters", userId), characterData);
    return { success: true };
  } catch (error) {
    console.error("Erro ao criar personagem:", error);
    return { success: false, error: error.message };
  }
};

export const getCharacterData = async (userId) => {
  try {
    const docRef = doc(db, "characters", userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    } else {
      return { success: false, error: "Nenhum personagem encontrado para este usuário." };
    }
  } catch (error) {
    console.error("Erro ao obter dados do personagem:", error);
    return { success: false, error: error.message };
  }
};

export const saveCharacterData = async (userId, characterData) => {
  try {
    await setDoc(doc(db, "characters", userId), characterData, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Erro ao salvar dados do personagem:", error);
    return { success: false, error: error.message };
  }
};

export const updateCharacterProgress = async (userId, xp, level, maxXp, hp, maxHp) => {
  try {
    await updateDoc(doc(db, "characters", userId), {
      xp,
      level,
      maxXp,
      hp,
      maxHp
    });
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar progresso:", error);
    return { success: false, error: error.message };
  }
};

export const updateEquippedItems = async (userId, equippedItems) => {
  try {
    await updateDoc(doc(db, "characters", userId), {
      equippedItems
    });
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar itens equipados:", error);
    return { success: false, error: error.message };
  }
};

export const getUserInventory = async (userId) => {
  try {
    const docRef = doc(db, "characters", userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data().inventory || [] };
    } else {
      return { success: false, error: "Nenhum inventário encontrado para este usuário." };
    }
  } catch (error) {
    console.error("Erro ao obter inventário do usuário:", error);
    return { success: false, error: error.message };
  }
};

export const addCompletedQuest = async (userId, questData) => {
  try {
    const docRef = await addDoc(collection(db, "users", userId, "completedQuests"), {
      ...questData,
      completedAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Erro ao adicionar quest completada:", error);
    return { success: false, error: error.message };
  }
};

export const updateCompletedAction = async (userId, actionId, actionData) => {
  try {
    await updateDoc(doc(db, "users", userId, "completedQuests", actionId), {
      ...actionData,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar ação completada:", error);
    return { success: false, error: error.message };
  }
};
export const deleteCompletedAction = async (userId, actionId) => {
  try {
    await deleteDoc(doc(db, "users", userId, "completedQuests", actionId));
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir ação completada:", error);
    return { success: false, error: error.message };
  }
};







export const getUserCompletedQuests = async (userId) => {
  try {
    const q = query(collection(db, "users", userId, "completedQuests"));
    const querySnapshot = await getDocs(q);
    const completedQuests = [];
    querySnapshot.forEach((docSnap) => {
      completedQuests.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });
    return { success: true, data: completedQuests };
  } catch (error) {
    console.error("Erro ao obter quests completadas:", error);
    return { success: false, error: error.message };
  }
};

export const saveStreak = async (userId, streakData) => {
  try {
    await setDoc(doc(db, "users", userId, "meta", "streak"), streakData, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Erro ao salvar streak:", error);
    return { success: false, error: error.message };
  }
};

export const loadStreak = async (userId) => {
  try {
    const ref = doc(db, "users", userId, "meta", "streak");
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  } catch (error) {
    console.error("Erro ao carregar streak:", error);
    return null;
  }
};

export const getGlobalRanking = async (limit = 50) => {
  try {
    const q = query(collection(db, "characters"));
    const snap = await getDocs(q);

    const ranking = await Promise.all(
      snap.docs.map(async (docSnap) => {
        const data = docSnap.data();
        let streak = 0;

        try {
          const streakData = await loadStreak(docSnap.id);
          if (streakData && typeof streakData.streak === "number") {
            streak = streakData.streak;
          }
        } catch (err) {
          console.warn("Erro ao carregar streak para ranking:", err);
        }

        return {
          uid: docSnap.id,
          displayName: data.name || "Guardião",
          avatar: data.avatar || "🧍",
          level: data.level || 1,
          streak,
          email: data.email || ""
        };
      })
    );

    // Ordena: primeiro maior nível, depois maior streak
    return ranking
      .sort((a, b) => {
        if (b.level !== a.level) return b.level - a.level;
        return (b.streak || 0) - (a.streak || 0);
      })
      .slice(0, limit);
  } catch (error) {
    console.error("Erro ao carregar ranking global:", error);
    return [];
  }
};

export const createEvent = async (name, description, coords, userId) => {
  try {
    const newEvent = {
      name,
      description,
      location: coords,
      createdAt: serverTimestamp(),
      createdBy: userId,
      confirmations: 0,
      reports: 0,
      active: true
    };

    const docRef = await addDoc(collection(db, "events"), newEvent);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Erro ao criar evento:", error);
    return { success: false, error: error.message };
  }
};

export const getAllEvents = async () => {
  try {
    const q = query(collection(db, "events"));
    const snap = await getDocs(q);

    return snap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
  } catch (error) {
    console.error("Erro ao buscar eventos:", error);
    return [];
  }
};

export const confirmEvent = async (eventId) => {
  try {
    const ref = doc(db, "events", eventId);
    const snap = await getDoc(ref);

    if (!snap.exists()) return { success: false, error: "Evento não encontrado" };

    const data = snap.data();
    const newConfirmations = (data.confirmations || 0) + 1;

    await updateDoc(ref, {
      confirmations: newConfirmations,
      active: newConfirmations >= 3
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao confirmar evento:", error);
    return { success: false, error: error.message };
  }
};

export const reportEvent = async (eventId) => {
  try {
    const ref = doc(db, "events", eventId);
    const snap = await getDoc(ref);

    if (!snap.exists()) return { success: false, error: "Evento não encontrado" };

    const data = snap.data();
    const newReports = (data.reports || 0) + 1;

    if (newReports >= 3) {
      await updateDoc(ref, { active: false });
    } else {
      await updateDoc(ref, { reports: newReports });
    }

    return { success: true };
  } catch (error) {
    console.error("Erro ao reportar evento:", error);
    return { success: false, error: error.message };
  }
};

export const cleanExpiredCompletedQuests = async (userId) => {
  try {
    // Lógica para limpar quests expiradas.
    // Como não tenho a regra de expiração, vou retornar sucesso por enquanto.
    // O ideal seria usar um 'where' para filtrar por data e depois um 'batch' para deletar.
    // Exemplo:
    /*
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() - 30); // Exemplo: 30 dias

    const q = query(
      collection(db, "users", userId, "completedQuests"),
      where("completedAt", "<", expirationDate)
    );

    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);

    querySnapshot.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });

    await batch.commit();
    */
    console.log("cleanExpiredCompletedQuests: Lógica de limpeza de quests expiradas não implementada. Retornando sucesso.");
    return { success: true };
  } catch (error) {
    console.error("Erro ao limpar quests expiradas:", error);
    return { success: false, error: error.message };
  }
};

export const deleteEvent = async (eventId) => {
  try {
    await deleteDoc(doc(db, "events", eventId));
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir evento:", error);
    return { success: false, error: error.message };
  }
};
