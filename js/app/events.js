function bindClick(id, handler) {
  document.getElementById(id)?.addEventListener('click', handler);
}

export function bindAppEvents(actions) {
  bindClick('btn-hero-play', actions.goToPlay);
  bindClick('btn-home-era', actions.goToEra);
  bindClick('btn-home-goat', actions.goToGoatCategories);
  bindClick('btn-home-dream', actions.goToDreamTeams);
  bindClick('btn-home-quiz', actions.goToQuizHub);
  bindClick('btn-home-quiz-cta', actions.goToQuizHub);
  bindClick('btn-play-era', actions.goToEra);
  bindClick('btn-play-goat', actions.goToGoatCategories);
  bindClick('btn-play-dream', actions.goToDreamTeams);
  bindClick('btn-play-quiz', actions.goToQuizHub);
  bindClick('btn-quiz-hub-back', actions.goToPlay);
  bindClick('btn-quiz-back', actions.goToQuizHub);
  bindClick('btn-quiz-result-back', actions.goToQuizHub);
  bindClick('btn-era-back', actions.goToPlay);
  bindClick('btn-era-lineup-back', actions.goToEra);
  bindClick('btn-goat-cats-back', actions.goToPlay);
  bindClick('btn-goat-back', actions.goToGoatCategories);
  bindClick('btn-dream-teams-back', actions.goToPlay);
  bindClick('btn-dream-back', actions.goBackFromDreamDraft);
  bindClick('btn-dream-result-back', actions.goToDreamTeams);
  bindClick('confirm-bar-btn', actions.startMatch);
  bindClick('btn-era-lineup-play', actions.startMatch);
  bindClick('btn-match-back', () => actions.confirmLeave('era'));
  bindClick('fight-btn', actions.resolveRound);
  bindClick('battle-ok-btn', actions.acknowledgeBattle);
  bindClick('btn-play-again', actions.playAgain);
  bindClick('btn-result-home', actions.goToHome);
  bindClick('btn-goat-again', actions.playGoatAgain);
  bindClick('btn-goat-categories', actions.goToGoatCategoriesFromResult);
  bindClick('btn-goat-pool', actions.openGoatPool);
  bindClick('goat-pool-close', actions.closeGoatPool);
  bindClick('btn-dream-again', actions.replayDreamDraft);
  bindClick('btn-dream-other-team', actions.goToDreamTeams);
  bindClick('btn-quiz-submit', actions.submitQuizAnswer);
  bindClick('btn-quiz-again', actions.replayQuizPack);
  bindClick('btn-quiz-other-pack', actions.goToQuizHub);
  bindClick('btn-goat-share', actions.shareGoatResult);
  bindClick('stats-profile-close', actions.closeStatsProfile);
  bindClick('team-lineup-close', actions.closeTeamLineup);

  document.getElementById('leave-match-cancel')?.addEventListener('click', event => {
    event.preventDefault();
    actions.cancelLeave();
  });
  document.getElementById('leave-match-confirm')?.addEventListener('click', event => {
    event.preventDefault();
    actions.proceedLeave();
  });
  document.getElementById('leave-match-dialog')?.addEventListener('cancel', event => {
    event.preventDefault();
    actions.cancelLeave();
  });
  document.getElementById('leave-match-dialog')?.addEventListener('click', event => {
    const dialog = event.currentTarget;
    if (event.target === dialog) actions.cancelLeave();
  });

  document.getElementById('goat-categories')?.addEventListener('click', event => {
    const card = event.target.closest('[data-goat-category], [data-goat-special]');
    if (card) actions.startGoatBracket(card.dataset.goatCategory || card.dataset.goatSpecial);
  });
  document.getElementById('goat-era-tabs')?.addEventListener('click', event => {
    const btn = event.target.closest('[data-goat-era]');
    if (btn) actions.setGoatEraMode(btn.dataset.goatEra);
  });
  document.getElementById('dream-team-grid')?.addEventListener('click', event => {
    const card = event.target.closest('[data-dream-team]');
    if (card) actions.startDreamDraft(card.dataset.dreamTeam);
  });
  document.getElementById('dream-candidate-grid')?.addEventListener('click', event => {
    const card = event.target.closest('[data-dream-player]');
    if (card) actions.selectDreamPlayer(card.dataset.dreamPlayer);
  });
  document.getElementById('quiz-pack-grid')?.addEventListener('click', event => {
    const card = event.target.closest('[data-quiz-pack]');
    if (card) actions.startQuizPack(card.dataset.quizPack);
  });
  document.getElementById('quiz-option-list')?.addEventListener('click', event => {
    const option = event.target.closest('[data-quiz-option]');
    if (option) actions.selectQuizOption(option.dataset.quizOption);
  });
  document.getElementById('stats-scope-tabs')?.addEventListener('click', event => {
    const btn = event.target.closest('[data-stats-scope]');
    if (btn) actions.setStatsScope(btn.dataset.statsScope);
  });
  document.getElementById('stats-category-tabs')?.addEventListener('click', event => {
    const btn = event.target.closest('[data-stats-category]');
    if (btn) actions.setStatsCategory(btn.dataset.statsCategory);
  });
  document.getElementById('stats-leaderboard')?.addEventListener('click', event => {
    const row = event.target.closest('[data-stats-entity]');
    if (row) actions.openStatsProfile(row.dataset.statsEntity, row.dataset.statsScope);
  });
  document.getElementById('stats-profile-overlay')?.addEventListener('click', event => {
    if (event.target === event.currentTarget) actions.closeStatsProfile();
  });
  document.getElementById('team-lineup-overlay')?.addEventListener('click', event => {
    if (event.target === event.currentTarget) actions.closeTeamLineup();
  });
  document.getElementById('goat-pool-overlay')?.addEventListener('click', event => {
    if (event.target === event.currentTarget) actions.closeGoatPool();
  });

  window.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    actions.closeGoatPool();
    actions.closeStatsProfile();
    actions.closeTeamLineup();
  });

  document.querySelectorAll('.filter-tab').forEach(btn => {
    btn.addEventListener('click', () => actions.filterTeams(btn.dataset.filter, btn));
  });

  document.querySelectorAll('.nav-item[data-screen]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.screen;
      if (document.querySelector('.screen.active')?.id === 'screen-match') {
        actions.confirmLeave(target);
        return;
      }
      if (target === 'play') {
        actions.goToPlay();
      } else {
        actions.goTo(target);
      }
    });
  });

  requestAnimationFrame(() => {
    const activeBtn = document.querySelector('.nav-item.active');
    if (activeBtn) actions.updateNavIndicator(activeBtn);
  });

  window.addEventListener('resize', () => {
    const activeBtn = document.querySelector('.nav-item.active');
    if (activeBtn) actions.updateNavIndicator(activeBtn);
  });
}
