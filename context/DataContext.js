"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  STORAGE_KEYS,
  defaultAnnouncements,
  defaultChallenges,
  defaultClubs,
  defaultEvents,
  defaultGallery,
  defaultProjects,
  defaultTeam,
  getStoredData,
  setStoredData
} from "../lib/storage";
import { isStaticExportMode } from "../lib/runtimeMode";
import { useAuth } from "./AuthContext";

const DataContext = createContext(null);

const initialState = {
  users: [],
  clubs: defaultClubs,
  events: defaultEvents,
  challenges: defaultChallenges,
  projects: defaultProjects,
  team: defaultTeam,
  gallery: defaultGallery,
  announcements: defaultAnnouncements,
  challengeSubmissions: {},
  registrations: {},
  clubRegistrations: {},
  emailNotifications: {},
  userProfiles: {},
  bannedUsers: [],
  adminAuditLog: []
};

const toDeadlineTimestamp = (deadline) => (deadline ? new Date(`${deadline}T23:59:59`).getTime() : 0);

const calculateTimeBonus = ({ submittedAt, deadline, maxTimeBonus }) => {
  const submittedTime = new Date(submittedAt).getTime();
  const deadlineTime = toDeadlineTimestamp(deadline);
  if (!submittedTime || !deadlineTime || submittedTime >= deadlineTime || maxTimeBonus <= 0) return 0;
  const dayMs = 1000 * 60 * 60 * 24;
  const daysEarly = Math.min(7, Math.max(0, Math.floor((deadlineTime - submittedTime) / dayMs)));
  return Number(((daysEarly / 7) * maxTimeBonus).toFixed(1));
};

const getRankBadge = (score) => {
  if (score >= 500) return "Legend";
  if (score >= 250) return "Expert";
  if (score >= 100) return "Contributor";
  return "Newbie";
};

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      success: false,
      message: data?.message || "Request failed."
    };
  }
  return data;
};

export function DataProvider({ children }) {
  const { user, setUsers } = useAuth();
  const [state, setState] = useState(initialState);

  const hydrate = (payload) => {
    const next = { ...initialState, ...(payload || {}) };
    setState(next);
    setUsers(next.users || []);
  };

  const refreshState = async () => {
    if (isStaticExportMode) {
      hydrate({
        users: getStoredData(STORAGE_KEYS.USERS, []),
        clubs: getStoredData(STORAGE_KEYS.CLUBS, defaultClubs),
        events: getStoredData(STORAGE_KEYS.EVENTS, defaultEvents),
        challenges: getStoredData(STORAGE_KEYS.CHALLENGES, defaultChallenges),
        projects: getStoredData(STORAGE_KEYS.PROJECTS, defaultProjects),
        team: getStoredData(STORAGE_KEYS.TEAM, defaultTeam),
        gallery: getStoredData(STORAGE_KEYS.GALLERY, defaultGallery),
        announcements: getStoredData(STORAGE_KEYS.ANNOUNCEMENTS, defaultAnnouncements),
        challengeSubmissions: getStoredData(STORAGE_KEYS.CHALLENGE_SUBMISSIONS, {}),
        registrations: getStoredData(STORAGE_KEYS.REGISTRATIONS, {}),
        clubRegistrations: getStoredData(STORAGE_KEYS.CLUB_REGISTRATIONS, {}),
        emailNotifications: getStoredData(STORAGE_KEYS.EMAIL_NOTIFICATIONS, {}),
        userProfiles: getStoredData(STORAGE_KEYS.USER_PROFILES, {}),
        bannedUsers: getStoredData(STORAGE_KEYS.BANNED_USERS, []),
        adminAuditLog: getStoredData(STORAGE_KEYS.ADMIN_AUDIT_LOG, [])
      });
      return { success: true };
    }

    const data = await requestJson("/api/platform", { cache: "no-store" });
    if (!data?.success && data?.message) return data;
    hydrate(data);
    return { success: true };
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (isStaticExportMode) {
        await refreshState();
        return;
      }
      const data = await requestJson("/api/platform", { cache: "no-store" });
      if (cancelled || data?.success === false) return;
      hydrate(data);
    };

    void load();
    const interval = isStaticExportMode
      ? null
      : window.setInterval(() => {
          void refreshState();
        }, 15000);

    return () => {
      cancelled = true;
      if (interval) window.clearInterval(interval);
    };
  }, []);

  const performAction = async (action, payload = {}) => {
    if (isStaticExportMode) {
      const next = {
        ...state,
        users: [...(state.users || [])],
        clubs: [...(state.clubs || [])],
        events: [...(state.events || [])],
        challenges: [...(state.challenges || [])],
        projects: [...(state.projects || [])],
        team: [...(state.team || [])],
        gallery: [...(state.gallery || [])],
        announcements: [...(state.announcements || [])],
        challengeSubmissions: { ...(state.challengeSubmissions || {}) },
        registrations: { ...(state.registrations || {}) },
        clubRegistrations: { ...(state.clubRegistrations || {}) },
        emailNotifications: { ...(state.emailNotifications || {}) },
        userProfiles: { ...(state.userProfiles || {}) },
        bannedUsers: [...(state.bannedUsers || [])],
        adminAuditLog: [...(state.adminAuditLog || [])]
      };
      let message = "Saved.";

      if (action === "joinEvent") {
        const email = payload.userEmail.toLowerCase();
        const current = next.registrations[email] || [];
        if (current.some((item) => item.eventId === payload.eventId)) {
          return { success: false, message: "You already registered for this event." };
        }
        next.registrations[email] = [
          ...current,
          {
            eventId: payload.eventId,
            fullName: payload.details?.fullName || "",
            email: payload.details?.email || email,
            phone: payload.details?.phone || "",
            department: payload.details?.department || "",
            year: payload.details?.year || "",
            registeredAt: new Date().toISOString()
          }
        ];
        setStoredData(STORAGE_KEYS.REGISTRATIONS, next.registrations);
        message = "Event registration confirmed.";
      } else if (action === "joinClub") {
        const email = payload.userEmail.toLowerCase();
        const current = next.clubRegistrations[email] || [];
        if (current.some((item) => item.eventId === payload.clubId)) {
          return { success: false, message: "You already joined this club." };
        }
        next.clubRegistrations[email] = [
          ...current,
          {
            eventId: payload.clubId,
            fullName: payload.details?.fullName || "",
            email: payload.details?.email || email,
            phone: payload.details?.phone || "",
            department: payload.details?.department || "",
            year: payload.details?.year || "",
            registeredAt: new Date().toISOString()
          }
        ];
        setStoredData(STORAGE_KEYS.CLUB_REGISTRATIONS, next.clubRegistrations);
        message = "Club joined successfully.";
      } else if (action === "submitChallenge") {
        const email = payload.userEmail.toLowerCase();
        const current = next.challengeSubmissions[email] || [];
        if (current.some((item) => item.challengeId === payload.challengeId)) {
          return { success: false, message: "You already submitted for this challenge." };
        }
        const urlRegex = /^https?:\/\/[^\s$.?#].[^\s]*$/i;
        if (!urlRegex.test(payload.githubLink) || !urlRegex.test(payload.demoLink)) {
          return { success: false, message: "Please enter valid GitHub and demo URLs." };
        }
        const challenge = next.challenges.find((entry) => entry.id === payload.challengeId);
        const submittedAt = new Date().toISOString();
        const timeBonus = calculateTimeBonus({
          submittedAt,
          deadline: challenge?.deadline,
          maxTimeBonus: challenge?.scoringRules?.maxTimeBonus || 0
        });
        next.challengeSubmissions[email] = [
          ...current,
          {
            id: `sub-${Date.now()}`,
            challengeId: payload.challengeId,
            githubLink: payload.githubLink,
            demoLink: payload.demoLink,
            reviewScore: 0,
            timeBonus,
            totalScore: timeBonus,
            status: "Submitted",
            reviewedAt: "",
            feedback: "",
            submittedAt
          }
        ];
        setStoredData(STORAGE_KEYS.CHALLENGE_SUBMISSIONS, next.challengeSubmissions);
        message = "Submission recorded.";
      } else if (action === "toggleProjectLike") {
        const email = payload.userEmail?.toLowerCase();
        if (!email) return { success: false, message: "Login required to like a project." };
        let updated = null;
        next.projects = next.projects.map((project) => {
          if (project.id !== payload.projectId) return project;
          const likedBy = Array.isArray(project.likedBy) ? project.likedBy : [];
          const hasLiked = likedBy.includes(email);
          updated = {
            ...project,
            likedBy: hasLiked ? likedBy.filter((entry) => entry !== email) : [...likedBy, email],
            likes: hasLiked ? Math.max(0, (project.likes || 0) - 1) : (project.likes || 0) + 1
          };
          return updated;
        });
        setStoredData(STORAGE_KEYS.PROJECTS, next.projects);
        message = updated?.likedBy?.includes(email) ? "Project starred." : "Project unstarred.";
      } else if (action === "updateUserProfile") {
        const email = payload.email.toLowerCase();
        next.userProfiles[email] = {
          ...(next.userProfiles[email] || {}),
          ...(payload.profilePayload || {})
        };
        setStoredData(STORAGE_KEYS.USER_PROFILES, next.userProfiles);
        message = "Profile settings updated.";
      } else if (action === "addAnnouncement") {
        next.announcements = [
          { id: `an-${Date.now()}`, text: payload.text, createdAt: new Date().toISOString() },
          ...next.announcements
        ].slice(0, 8);
        setStoredData(STORAGE_KEYS.ANNOUNCEMENTS, next.announcements);
        message = "Announcement added.";
      } else if (action === "addAdminAuditLog") {
        next.adminAuditLog = [
          {
            id: `audit-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
            actorEmail: payload.actorEmail || user?.email || "admin",
            action: payload.action,
            target: payload.target || "",
            details: payload.details || "",
            createdAt: new Date().toISOString()
          },
          ...next.adminAuditLog
        ].slice(0, 120);
        setStoredData(STORAGE_KEYS.ADMIN_AUDIT_LOG, next.adminAuditLog);
        message = "Audit log updated.";
      } else {
        return { success: false, message: "This action is available only in the full-stack deployment." };
      }

      hydrate(next);
      return { success: true, message, state: next };
    }

    const data = await requestJson("/api/platform/action", {
      method: "POST",
      body: JSON.stringify({ action, payload })
    });
    if (data?.state) hydrate(data.state);
    return data;
  };

  const {
    users,
    clubs,
    events,
    challenges,
    projects,
    team,
    gallery,
    announcements,
    challengeSubmissions,
    registrations,
    clubRegistrations,
    emailNotifications,
    userProfiles,
    bannedUsers,
    adminAuditLog
  } = state;

  const addClub = async (payload) => performAction("addClub", payload);
  const editClub = async (id, payload) => performAction("editClub", { id, payload });
  const deleteClub = async (id) => performAction("deleteClub", { id });
  const setClubLeader = async (clubId, leaderEmail, leaderName) =>
    performAction("setClubLeader", { clubId, leaderEmail, leaderName });
  const updateClubPoints = async (id, delta) => performAction("updateClubPoints", { id, delta });

  const addEvent = async (payload) => performAction("addEvent", { payload });
  const editEvent = async (id, payload) => performAction("editEvent", { id, payload });
  const deleteEvent = async (id) => performAction("deleteEvent", { id });

  const addProject = async (payload) => performAction("addProject", { payload });
  const editProject = async (id, payload) => performAction("editProject", { id, payload });
  const deleteProject = async (id) => performAction("deleteProject", { id });
  const toggleProjectLike = async ({ projectId, userEmail }) =>
    performAction("toggleProjectLike", { projectId, userEmail });

  const addChallenge = async (payload) => performAction("addChallenge", { payload });
  const editChallenge = async (id, payload) => performAction("editChallenge", { id, payload });
  const deleteChallenge = async (id) => performAction("deleteChallenge", { id });

  const addTeamMember = async (payload) => performAction("addTeamMember", { payload });
  const editTeamMember = async (id, payload) => performAction("editTeamMember", { id, payload });
  const deleteTeamMember = async (id) => performAction("deleteTeamMember", { id });

  const addGalleryImage = async (payload) => performAction("addGalleryImage", payload);
  const addGalleryItems = async (items) => performAction("addGalleryItems", { items });
  const deleteGalleryImage = async (id) => performAction("deleteGalleryImage", { id });

  const addAnnouncement = async (text) => performAction("addAnnouncement", { text });

  const joinEvent = async ({ userEmail, eventId, details }) => {
    const result = await performAction("joinEvent", { userEmail, eventId, details });
    return Boolean(result.success);
  };
  const isRegistered = ({ userEmail, eventId }) =>
    userEmail ? (registrations[userEmail.toLowerCase()] || []).some((item) => item.eventId === eventId) : false;
  const getUserRegistrations = (userEmail) => (userEmail ? registrations[userEmail.toLowerCase()] || [] : []);

  const joinClub = async ({ userEmail, clubId, details }) => {
    const result = await performAction("joinClub", { userEmail, clubId, details });
    return Boolean(result.success);
  };
  const isClubRegistered = ({ userEmail, clubId }) =>
    userEmail ? (clubRegistrations[userEmail.toLowerCase()] || []).some((item) => item.eventId === clubId) : false;

  const submitChallenge = async ({ userEmail, challengeId, githubLink, demoLink }) =>
    performAction("submitChallenge", { userEmail, challengeId, githubLink, demoLink });

  const getUserSubmissions = (userEmail) => (userEmail ? challengeSubmissions[userEmail.toLowerCase()] || [] : []);
  const getAllSubmissions = () => Object.values(challengeSubmissions).flat();

  const reviewChallengeSubmission = async ({ submissionId, reviewerEmail, reviewScore, status, feedback }) =>
    performAction("reviewChallengeSubmission", { submissionId, reviewerEmail, reviewScore, status, feedback });

  const getChallengeLeaderboard = (challengeId) =>
    Object.entries(challengeSubmissions)
      .flatMap(([email, submissions]) =>
        submissions
          .filter((submission) => submission.challengeId === challengeId)
          .map((submission) => {
            const matchingUser = users.find((entry) => entry.email === email);
            return {
              id: submission.id,
              email,
              name: matchingUser?.name || email,
              reviewScore: submission.reviewScore || 0,
              timeBonus: submission.timeBonus || 0,
              totalScore: submission.totalScore || 0,
              submittedAt: submission.submittedAt,
              status: submission.status || "Submitted"
            };
          })
      )
      .sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
      })
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

  const getGlobalChallengeLeaderboard = () =>
    Object.entries(challengeSubmissions)
      .map(([email, submissions]) => {
        const matchingUser = users.find((entry) => entry.email === email);
        const totalScore = submissions.reduce((sum, submission) => sum + (submission.totalScore || 0), 0);
        return {
          email,
          name: matchingUser?.name || email,
          score: Number(totalScore.toFixed(1)),
          totalSubmissions: submissions.length,
          gradedSubmissions: submissions.filter((submission) => submission.status === "Graded").length,
          badge: getRankBadge(totalScore)
        };
      })
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

  const getEventLeaderboard = (eventId) => getChallengeLeaderboard(eventId);
  const getEventRegistrationsByEvent = (eventId) =>
    Object.values(registrations).flat().filter((entry) => entry.eventId === eventId);
  const getClubRegistrationsByClub = (clubId) =>
    Object.values(clubRegistrations).flat().filter((entry) => entry.eventId === clubId);
  const getUserEmailNotifications = (userEmail) => (userEmail ? emailNotifications[userEmail.toLowerCase()] || [] : []);

  const updateUserProfile = async (email, profilePayload) =>
    performAction("updateUserProfile", { email, profilePayload });
  const getUserProfile = (email) => userProfiles[email?.toLowerCase()] || {};

  const addAdminAuditLog = async (payload) => performAction("addAdminAuditLog", payload);

  const resetUserPassword = async (email, nextPassword) =>
    performAction("resetUserPassword", { email, nextPassword });
  const createUser = async (payload) => performAction("createUser", payload);
  const updateUser = async (currentEmail, payload) => performAction("updateUser", { currentEmail, payload });
  const deleteUser = async (email) => performAction("deleteUser", { email });
  const promoteUser = async (email) => performAction("promoteUser", { email });
  const banUser = async (email) => performAction("banUser", { email });
  const unbanUser = async (email) => performAction("unbanUser", { email });

  const leaderboard = [...clubs]
    .sort((a, b) => (Number(b.points) || 0) - (Number(a.points) || 0))
    .map((club) => ({ id: club.id, name: club.name, score: Number(club.points) || 0 }));

  const scoreLeaderboard = useMemo(
    () =>
      users
        .filter((entry) => entry.role === "member")
        .map((entry) => ({
          email: entry.email,
          name: entry.name || entry.email,
          score: (challengeSubmissions[entry.email] || []).reduce((sum, sub) => sum + (sub.totalScore || 0), 0),
          badge: getRankBadge((challengeSubmissions[entry.email] || []).reduce((sum, sub) => sum + (sub.totalScore || 0), 0))
        }))
        .sort((a, b) => b.score - a.score)
        .map((entry, index) => ({ ...entry, rank: index + 1 })),
    [users, challengeSubmissions]
  );

  const stats = useMemo(() => {
    const totalRegistrations = Object.values(registrations).flat().length;
    const activeUsers = users.filter((entry) => {
      const email = entry.email?.toLowerCase();
      return (
        (challengeSubmissions[email] || []).length > 0 ||
        (registrations[email] || []).length > 0 ||
        (clubRegistrations[email] || []).length > 0
      );
    }).length;
    return {
      totalUsers: users.length,
      totalEvents: events.length,
      totalSubmissions: getAllSubmissions().length,
      totalProjects: projects.length,
      totalRegistrations,
      activeUsers
    };
  }, [users, events, projects, challengeSubmissions, registrations, clubRegistrations]);

  const adminAnalytics = useMemo(() => {
    const signupsByDay = users.reduce((acc, entry) => {
      const key = (entry.createdAt || "").slice(0, 10) || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return {
      signupsByDay: Object.entries(signupsByDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([label, value]) => ({ label, value })),
      registrationsByEvent: events.map((event) => ({
        label: event.title,
        value: getEventRegistrationsByEvent(event.id).length
      })),
      submissionsByChallenge: challenges.map((challenge) => ({
        label: challenge.title,
        value: getChallengeLeaderboard(challenge.id).length
      }))
    };
  }, [users, events, challenges, registrations, challengeSubmissions]);

  const listUsers = () => users;
  const getUserChallengeRank = (email) =>
    scoreLeaderboard.find((entry) => entry.email === email?.toLowerCase())?.rank || null;

  const getUserAnalytics = (email) => {
    const normalizedEmail = email?.toLowerCase();
    if (!normalizedEmail) {
      return {
        totalScore: 0,
        rankBadge: "Newbie",
        participationRate: 0,
        winRate: 0,
        scoreTimeline: [],
        heatmap: []
      };
    }

    const submissions = challengeSubmissions[normalizedEmail] || [];
    const totalScore = submissions.reduce((sum, submission) => sum + (submission.totalScore || 0), 0);
    const wins = submissions.filter((submission) => {
      const board = getChallengeLeaderboard(submission.challengeId);
      return board[0]?.email === normalizedEmail;
    }).length;
    const participationRate = challenges.length
      ? Number(((submissions.length / challenges.length) * 100).toFixed(1))
      : 0;
    const winRate = submissions.length ? Number(((wins / submissions.length) * 100).toFixed(1)) : 0;

    const scoreTimeline = [...submissions]
      .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())
      .reduce((acc, submission) => {
        const previous = acc[acc.length - 1]?.score || 0;
        acc.push({
          date: submission.submittedAt,
          score: Number((previous + (submission.totalScore || 0)).toFixed(1))
        });
        return acc;
      }, []);

    const last42Days = Array.from({ length: 42 }).map((_, index) => {
      const day = new Date();
      day.setDate(day.getDate() - (41 - index));
      const isoDay = day.toISOString().slice(0, 10);
      const count = submissions.filter((submission) => submission.submittedAt.slice(0, 10) === isoDay).length;
      return {
        date: isoDay,
        count,
        level: Math.min(4, count)
      };
    });

    return {
      totalScore: Number(totalScore.toFixed(1)),
      rankBadge: getRankBadge(totalScore),
      participationRate,
      winRate,
      scoreTimeline,
      heatmap: last42Days
    };
  };

  const value = useMemo(
    () => ({
      clubs,
      events,
      challenges,
      projects,
      team,
      gallery,
      announcements,
      leaderboard,
      scoreLeaderboard,
      stats,
      adminAnalytics,
      bannedUsers,
      adminAuditLog,
      addClub,
      editClub,
      setClubLeader,
      deleteClub,
      updateClubPoints,
      addEvent,
      editEvent,
      deleteEvent,
      addChallenge,
      editChallenge,
      deleteChallenge,
      addProject,
      editProject,
      deleteProject,
      toggleProjectLike,
      addTeamMember,
      editTeamMember,
      deleteTeamMember,
      addGalleryImage,
      addGalleryItems,
      deleteGalleryImage,
      addAnnouncement,
      joinEvent,
      isRegistered,
      getUserRegistrations,
      joinClub,
      isClubRegistered,
      submitChallenge,
      reviewChallengeSubmission,
      getUserSubmissions,
      getAllSubmissions,
      getChallengeLeaderboard,
      getGlobalChallengeLeaderboard,
      getEventLeaderboard,
      getEventRegistrationsByEvent,
      getClubRegistrationsByClub,
      getUserEmailNotifications,
      updateUserProfile,
      getUserProfile,
      addAdminAuditLog,
      createUser,
      updateUser,
      deleteUser,
      resetUserPassword,
      listUsers,
      getUserChallengeRank,
      getUserAnalytics,
      promoteUser,
      banUser,
      unbanUser,
      refreshState,
      calculateTimeBonus,
      currentUser: user
    }),
    [
      user,
      clubs,
      events,
      challenges,
      projects,
      team,
      gallery,
      announcements,
      leaderboard,
      scoreLeaderboard,
      stats,
      adminAnalytics,
      bannedUsers,
      adminAuditLog,
      registrations,
      clubRegistrations,
      challengeSubmissions,
      emailNotifications,
      userProfiles
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useClubData() {
  return useContext(DataContext);
}
