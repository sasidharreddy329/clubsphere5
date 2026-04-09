import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getSessionUser } from "../../../../lib/server/auth";
import { getStore, normalizeEmail, publicStore, saveStore } from "../../../../lib/server/store";

const toDeadlineTimestamp = (deadline) => (deadline ? new Date(`${deadline}T23:59:59`).getTime() : 0);

const calculateTimeBonus = ({ submittedAt, deadline, maxTimeBonus }) => {
  const submittedTime = new Date(submittedAt).getTime();
  const deadlineTime = toDeadlineTimestamp(deadline);
  if (!submittedTime || !deadlineTime || submittedTime >= deadlineTime || maxTimeBonus <= 0) return 0;
  const dayMs = 1000 * 60 * 60 * 24;
  const daysEarly = Math.min(7, Math.max(0, Math.floor((deadlineTime - submittedTime) / dayMs)));
  return Number(((daysEarly / 7) * maxTimeBonus).toFixed(1));
};

const normalizeEvent = (item, index = 0) => ({
  id: item?.id || `ev-${Date.now()}-${index}`,
  title: item?.title || "Untitled Event",
  date: item?.date || "",
  time: item?.time || "",
  mode: item?.mode || "Offline",
  venue: item?.venue || (item?.mode === "Online" ? "Online" : "Campus Venue"),
  category: item?.category || "Workshop",
  published: item?.published ?? true,
  banner: item?.banner || "",
  description: item?.description || "",
  richDescription: item?.richDescription || `<p>${item?.description || ""}</p>`,
  schedule: Array.isArray(item?.schedule) ? item.schedule : [],
  speakers: Array.isArray(item?.speakers) ? item.speakers : [],
  hosts: Array.isArray(item?.hosts) ? item.hosts : [],
  faqs: Array.isArray(item?.faqs) ? item.faqs : [],
  results: item?.results || "",
  winnerHighlights: Array.isArray(item?.winnerHighlights) ? item.winnerHighlights : [],
  galleryLink: item?.galleryLink || ""
});

const normalizeChallenge = (item, index = 0) => ({
  id: item?.id || `ch-${Date.now()}-${index}`,
  title: item?.title || "Untitled Challenge",
  category: item?.category || "Open Innovation",
  difficulty: item?.difficulty || "Medium",
  deadline: item?.deadline || "",
  description: item?.description || "",
  problemStatement: item?.problemStatement || `<p>${item?.description || ""}</p>`,
  scoringRules: {
    maxScore: Number(item?.scoringRules?.maxScore ?? item?.maxScore ?? 100) || 100,
    maxTimeBonus: Number(item?.scoringRules?.maxTimeBonus ?? item?.maxTimeBonus ?? 0) || 0
  }
});

const normalizeProject = (item, index = 0) => ({
  id: item?.id || `pr-${Date.now()}-${index}`,
  title: item?.title || "Untitled Project",
  featured: item?.featured ?? false,
  archived: item?.archived ?? false,
  year: item?.year || "",
  domain: item?.domain || "General",
  thumbnail: item?.thumbnail || "",
  description: item?.description || "",
  longDescription: item?.longDescription || item?.description || "",
  tech: item?.tech || "",
  members: Array.isArray(item?.members) ? item.members : [],
  github: item?.github || "",
  demo: item?.demo || "",
  documentation: item?.documentation || "",
  likes: Number(item?.likes || 0) || 0,
  likedBy: Array.isArray(item?.likedBy) ? item.likedBy : [],
  screenshots: Array.isArray(item?.screenshots) ? item.screenshots : []
});

const requireAuth = (user) =>
  user
    ? null
    : NextResponse.json({ success: false, message: "Login required." }, { status: 401 });

const requireAdmin = (user) =>
  user?.role === "admin"
    ? null
    : NextResponse.json({ success: false, message: "Admin access required." }, { status: 403 });

const findUser = (store, email) => store.users.find((user) => user.email === normalizeEmail(email));

const moveUserScopedRecord = (map, currentEmail, nextEmail, transform) => {
  if (!map[currentEmail] || currentEmail === nextEmail) return map;
  const next = { ...map };
  next[nextEmail] = transform ? next[currentEmail].map(transform) : next[currentEmail];
  delete next[currentEmail];
  return next;
};

export async function POST(request) {
  const sessionUser = await getSessionUser(request);
  const authError = requireAuth(sessionUser);
  if (authError) return authError;

  const body = await request.json();
  const { action, payload = {} } = body || {};
  const store = await getStore();
  const state = store.state;
  let message = "Saved.";

  switch (action) {
    case "joinEvent": {
      const email = normalizeEmail(payload.userEmail || sessionUser.email);
      const current = state.registrations[email] || [];
      if (current.some((item) => item.eventId === payload.eventId)) {
        return NextResponse.json({ success: false, message: "You already registered for this event." }, { status: 409 });
      }
      state.registrations[email] = [
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
      message = "Event registration confirmed.";
      break;
    }
    case "joinClub": {
      const email = normalizeEmail(payload.userEmail || sessionUser.email);
      const current = state.clubRegistrations[email] || [];
      if (current.some((item) => item.eventId === payload.clubId)) {
        return NextResponse.json({ success: false, message: "You already joined this club." }, { status: 409 });
      }
      state.clubRegistrations[email] = [
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
      message = "Club joined successfully.";
      break;
    }
    case "submitChallenge": {
      const email = normalizeEmail(payload.userEmail || sessionUser.email);
      const current = state.challengeSubmissions[email] || [];
      if (current.some((item) => item.challengeId === payload.challengeId)) {
        return NextResponse.json({ success: false, message: "You already submitted for this challenge." }, { status: 409 });
      }
      const urlRegex = /^https?:\/\/[^\s$.?#].[^\s]*$/i;
      if (!urlRegex.test(payload.githubLink) || !urlRegex.test(payload.demoLink)) {
        return NextResponse.json({ success: false, message: "Please enter valid GitHub and demo URLs." }, { status: 400 });
      }
      const challenge = state.challenges.find((entry) => entry.id === payload.challengeId);
      const submittedAt = new Date().toISOString();
      const timeBonus = calculateTimeBonus({
        submittedAt,
        deadline: challenge?.deadline,
        maxTimeBonus: challenge?.scoringRules?.maxTimeBonus || 0
      });
      state.challengeSubmissions[email] = [
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
      message = "Submission recorded.";
      break;
    }
    case "toggleProjectLike": {
      const email = normalizeEmail(payload.userEmail || sessionUser.email);
      let updated = null;
      state.projects = state.projects.map((project) => {
        if (project.id !== payload.projectId) return project;
        const likedBy = Array.isArray(project.likedBy) ? project.likedBy : [];
        const hasLiked = likedBy.includes(email);
        updated = normalizeProject({
          ...project,
          likedBy: hasLiked ? likedBy.filter((entry) => entry !== email) : [...likedBy, email],
          likes: hasLiked ? Math.max(0, (project.likes || 0) - 1) : (project.likes || 0) + 1
        });
        return updated;
      });
      if (!updated) {
        return NextResponse.json({ success: false, message: "Project not found." }, { status: 404 });
      }
      message = updated.likedBy.includes(email) ? "Project starred." : "Project unstarred.";
      break;
    }
    case "updateUserProfile": {
      const email = normalizeEmail(payload.email || sessionUser.email);
      state.userProfiles[email] = {
        ...(state.userProfiles[email] || {}),
        ...(payload.profilePayload || {})
      };
      message = "Profile settings updated.";
      break;
    }
    case "addAnnouncement":
    case "addClub":
    case "editClub":
    case "setClubLeader":
    case "deleteClub":
    case "updateClubPoints":
    case "addEvent":
    case "editEvent":
    case "deleteEvent":
    case "addChallenge":
    case "editChallenge":
    case "deleteChallenge":
    case "addProject":
    case "editProject":
    case "deleteProject":
    case "addTeamMember":
    case "editTeamMember":
    case "deleteTeamMember":
    case "addGalleryImage":
    case "addGalleryItems":
    case "deleteGalleryImage":
    case "reviewChallengeSubmission":
    case "addAdminAuditLog":
    case "createUser":
    case "updateUser":
    case "deleteUser":
    case "resetUserPassword":
    case "promoteUser":
    case "banUser":
    case "unbanUser": {
      const adminError = requireAdmin(sessionUser);
      if (adminError) return adminError;

      if (action === "addAnnouncement") {
        state.announcements = [
          { id: `an-${Date.now()}`, text: payload.text, createdAt: new Date().toISOString() },
          ...(state.announcements || [])
        ].slice(0, 8);
        message = "Announcement added.";
      }

      if (action === "addClub") {
        state.clubs = [
          {
            id: `cl-${Date.now()}`,
            name: payload.name,
            description: payload.description,
            points: Number(payload.points) || 0,
            leaderEmail: "",
            leaderName: ""
          },
          ...state.clubs
        ];
        message = "Club added.";
      }

      if (action === "editClub") {
        state.clubs = state.clubs.map((club) => (club.id === payload.id ? { ...club, ...payload.payload } : club));
        message = "Club updated.";
      }

      if (action === "setClubLeader") {
        state.clubs = state.clubs.map((club) =>
          club.id === payload.clubId
            ? { ...club, leaderEmail: payload.leaderEmail || "", leaderName: payload.leaderName || "" }
            : club
        );
        message = "Club leader updated.";
      }

      if (action === "deleteClub") {
        state.clubs = state.clubs.filter((club) => club.id !== payload.id);
        message = "Club deleted.";
      }

      if (action === "updateClubPoints") {
        state.clubs = state.clubs.map((club) =>
          club.id === payload.id
            ? { ...club, points: Math.max(0, (Number(club.points) || 0) + (Number(payload.delta) || 0)) }
            : club
        );
        message = "Club points updated.";
      }

      if (action === "addEvent") {
        state.events = [normalizeEvent({ id: `ev-${Date.now()}`, ...payload.payload }), ...state.events];
        message = "Event added.";
      }

      if (action === "editEvent") {
        state.events = state.events.map((event) =>
          event.id === payload.id ? normalizeEvent({ ...event, ...payload.payload }) : event
        );
        message = "Event updated.";
      }

      if (action === "deleteEvent") {
        state.events = state.events.filter((event) => event.id !== payload.id);
        message = "Event deleted.";
      }

      if (action === "addChallenge") {
        state.challenges = [normalizeChallenge({ id: `ch-${Date.now()}`, ...payload.payload }), ...state.challenges];
        message = "Challenge added.";
      }

      if (action === "editChallenge") {
        state.challenges = state.challenges.map((challenge) =>
          challenge.id === payload.id ? normalizeChallenge({ ...challenge, ...payload.payload }) : challenge
        );
        message = "Challenge updated.";
      }

      if (action === "deleteChallenge") {
        state.challenges = state.challenges.filter((challenge) => challenge.id !== payload.id);
        message = "Challenge deleted.";
      }

      if (action === "addProject") {
        state.projects = [normalizeProject({ id: `pr-${Date.now()}`, ...payload.payload }), ...state.projects];
        message = "Project added.";
      }

      if (action === "editProject") {
        state.projects = state.projects.map((project) =>
          project.id === payload.id ? normalizeProject({ ...project, ...payload.payload }) : project
        );
        message = "Project updated.";
      }

      if (action === "deleteProject") {
        state.projects = state.projects.filter((project) => project.id !== payload.id);
        message = "Project deleted.";
      }

      if (action === "addTeamMember") {
        state.team = [{ id: `tm-${Date.now()}`, ...payload.payload }, ...state.team];
        message = "Team member added.";
      }

      if (action === "editTeamMember") {
        state.team = state.team.map((member) => (member.id === payload.id ? { ...member, ...payload.payload } : member));
        message = "Team member updated.";
      }

      if (action === "deleteTeamMember") {
        state.team = state.team.filter((member) => member.id !== payload.id);
        message = "Team member deleted.";
      }

      if (action === "addGalleryImage") {
        state.gallery = [
          {
            id: `gl-${Date.now()}`,
            src: payload.src,
            album: payload.album || "General",
            eventDate: payload.eventDate || "",
            type: payload.type === "video" ? "video" : "image"
          },
          ...state.gallery
        ];
        message = "Gallery image added.";
      }

      if (action === "addGalleryItems") {
        const nextItems = (payload.items || []).map((item, index) => ({
          id: `gl-${Date.now()}-${index}`,
          src: item.src,
          album: item.album || "General",
          eventDate: item.eventDate || "",
          type: item.type === "video" ? "video" : "image"
        }));
        state.gallery = [...nextItems, ...state.gallery];
        message = "Gallery updated.";
      }

      if (action === "deleteGalleryImage") {
        state.gallery = state.gallery.filter((item) => item.id !== payload.id);
        message = "Gallery item deleted.";
      }

      if (action === "reviewChallengeSubmission") {
        let updated = false;
        Object.keys(state.challengeSubmissions).forEach((email) => {
          state.challengeSubmissions[email] = (state.challengeSubmissions[email] || []).map((submission) => {
            if (submission.id !== payload.submissionId) return submission;
            const challenge = state.challenges.find((entry) => entry.id === submission.challengeId);
            const maxScore = challenge?.scoringRules?.maxScore || 100;
            const safeReviewScore = Math.max(0, Math.min(maxScore, Number(payload.reviewScore) || 0));
            updated = true;
            return {
              ...submission,
              reviewScore: safeReviewScore,
              totalScore: Number((safeReviewScore + (submission.timeBonus || 0)).toFixed(1)),
              status: payload.status || "Graded",
              feedback: payload.feedback || "",
              reviewedAt: new Date().toISOString(),
              reviewerEmail: payload.reviewerEmail || sessionUser.email
            };
          });
        });
        if (!updated) {
          return NextResponse.json({ success: false, message: "Submission not found." }, { status: 404 });
        }
        message = "Submission reviewed.";
      }

      if (action === "addAdminAuditLog") {
        state.adminAuditLog = [
          {
            id: `audit-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
            actorEmail: payload.actorEmail || sessionUser.email,
            action: payload.action,
            target: payload.target || "",
            details: payload.details || "",
            createdAt: new Date().toISOString()
          },
          ...(state.adminAuditLog || [])
        ].slice(0, 120);
        message = "Audit log updated.";
      }

      if (action === "createUser") {
        const email = normalizeEmail(payload.email);
        if (!payload.name?.trim() || !email || !payload.password?.trim()) {
          return NextResponse.json({ success: false, message: "Name, email, and password are required." }, { status: 400 });
        }
        if (store.users.some((user) => user.email === email)) {
          return NextResponse.json({ success: false, message: "A user with this email already exists." }, { status: 409 });
        }
        store.users.unshift({
          id: `u-${Date.now()}`,
          name: payload.name.trim(),
          email,
          passwordHash: await bcrypt.hash(payload.password, 10),
          role: payload.role === "admin" ? "admin" : "member",
          authType: "credentials",
          createdAt: new Date().toISOString()
        });
        message = "User added successfully.";
      }

      if (action === "updateUser") {
        const currentEmail = normalizeEmail(payload.currentEmail);
        const nextEmail = normalizeEmail(payload.payload?.email);
        const targetIndex = store.users.findIndex((user) => user.email === currentEmail);
        if (targetIndex === -1) {
          return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
        }
        if (currentEmail !== nextEmail && store.users.some((user) => user.email === nextEmail)) {
          return NextResponse.json({ success: false, message: "Another user already uses that email." }, { status: 409 });
        }
        const target = store.users[targetIndex];
        store.users[targetIndex] = {
          ...target,
          name: payload.payload.name.trim(),
          email: nextEmail,
          role: payload.payload.role === "admin" ? "admin" : "member",
          passwordHash: payload.payload.password
            ? await bcrypt.hash(payload.payload.password, 10)
            : target.passwordHash
        };
        state.userProfiles = moveUserScopedRecord(state.userProfiles, currentEmail, nextEmail);
        state.registrations = moveUserScopedRecord(state.registrations, currentEmail, nextEmail, (entry) => ({
          ...entry,
          email: nextEmail
        }));
        state.clubRegistrations = moveUserScopedRecord(state.clubRegistrations, currentEmail, nextEmail, (entry) => ({
          ...entry,
          email: nextEmail
        }));
        state.challengeSubmissions = moveUserScopedRecord(state.challengeSubmissions, currentEmail, nextEmail);
        state.emailNotifications = moveUserScopedRecord(state.emailNotifications, currentEmail, nextEmail);
        state.bannedUsers = (state.bannedUsers || []).map((entry) => (entry === currentEmail ? nextEmail : entry));
        message = "User updated successfully.";
      }

      if (action === "deleteUser") {
        const email = normalizeEmail(payload.email);
        if (email === "admin@clubsphere.com") {
          return NextResponse.json({ success: false, message: "The default admin account cannot be removed." }, { status: 400 });
        }
        const before = store.users.length;
        store.users = store.users.filter((user) => user.email !== email);
        if (before === store.users.length) {
          return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
        }
        delete state.userProfiles[email];
        delete state.registrations[email];
        delete state.clubRegistrations[email];
        delete state.challengeSubmissions[email];
        delete state.emailNotifications[email];
        state.bannedUsers = (state.bannedUsers || []).filter((entry) => entry !== email);
        message = "User removed successfully.";
      }

      if (action === "resetUserPassword") {
        const email = normalizeEmail(payload.email);
        const target = findUser(store, email);
        if (!target) {
          return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
        }
        target.passwordHash = await bcrypt.hash(payload.nextPassword, 10);
        message = "Password reset successfully.";
      }

      if (action === "promoteUser") {
        const target = findUser(store, payload.email);
        if (!target) {
          return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
        }
        target.role = "admin";
        message = "User promoted to admin.";
      }

      if (action === "banUser") {
        const email = normalizeEmail(payload.email);
        state.bannedUsers = state.bannedUsers.includes(email) ? state.bannedUsers : [...state.bannedUsers, email];
        message = "User banned.";
      }

      if (action === "unbanUser") {
        const email = normalizeEmail(payload.email);
        state.bannedUsers = state.bannedUsers.filter((entry) => entry !== email);
        message = "User unbanned.";
      }
      break;
    }
    default:
      return NextResponse.json({ success: false, message: "Unsupported action." }, { status: 400 });
  }

  await saveStore(store);
  return NextResponse.json({
    success: true,
    message,
    state: publicStore(store)
  });
}
