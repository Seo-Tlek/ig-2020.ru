(function () {
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      nav.classList.toggle("is-open");
    });
  }

  var input = document.querySelector("[data-game-search]");
  if (input) {
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-game-card]"));
    input.addEventListener("input", function () {
      var q = input.value.trim().toLowerCase();
      cards.forEach(function (card) {
        var name = (card.getAttribute("data-name") || "").toLowerCase();
        card.classList.toggle("hidden", q && name.indexOf(q) === -1);
      });
    });
  }

  var slider = document.querySelector("[data-guides-slider]");
  if (slider) {
    var view = slider.querySelector(".guides-viewport");
    var prev = slider.querySelector("[data-guides-prev]");
    var next = slider.querySelector("[data-guides-next]");

    var gap = 16;

    function layout() {
      var slides = view.querySelectorAll(".guide-slide");
      if (!slides.length) return;
      var per = window.innerWidth > 800 ? 2 : 1;
      var width = (view.clientWidth - gap * (per - 1)) / per;
      for (var i = 0; i < slides.length; i++) {
        slides[i].style.flexBasis = width + "px";
        slides[i].style.width = width + "px";
      }
    }

    function step() {
      var slide = view.querySelector(".guide-slide");
      if (!slide) return view.clientWidth;
      return slide.getBoundingClientRect().width + gap;
    }

    function scrollByStep(direction) {
      view.scrollBy({ left: direction * step(), behavior: "smooth" });
    }

    layout();
    window.addEventListener("resize", layout);
    if (prev) prev.addEventListener("click", function () { scrollByStep(-1); });
    if (next) next.addEventListener("click", function () { scrollByStep(1); });
  }

  var poll = document.querySelector("[data-poll]");
  if (poll) {
    var pollBase = "https://abacus.jasoncameron.dev";
    var pollNs = "ig2020ru";
    var pollKeys = { yes: "program-yes", no: "program-no" };
    var pollStore = "ig2020-poll-program";
    var yesCount = poll.querySelector("[data-count=yes]");
    var noCount = poll.querySelector("[data-count=no]");
    var pollNote = poll.querySelector("[data-poll-note]");
    var pollButtons = poll.querySelectorAll("[data-vote]");
    var pollCounts = { yes: 0, no: 0 };

    function pollRead(key) {
      try {
        return localStorage.getItem(key);
      } catch (err) {
        return null;
      }
    }

    function pollWrite(key, value) {
      try {
        localStorage.setItem(key, value);
      } catch (err) {}
    }

    function paintPoll() {
      yesCount.textContent = String(pollCounts.yes);
      noCount.textContent = String(pollCounts.no);
      var voted = pollRead(pollStore);
      for (var i = 0; i < pollButtons.length; i++) {
        var choice = pollButtons[i].getAttribute("data-vote");
        pollButtons[i].disabled = !!voted;
        pollButtons[i].classList.toggle("is-chosen", voted === choice);
      }
      if (pollCounts.yes > 1000) {
        pollNote.textContent = "За программу уже больше 1000 голосов. Такое приложение для Windows сделаем.";
      } else if (voted) {
        pollNote.textContent = "Голос учтён. Если за программу наберётся больше 1000 голосов, сделаем приложение для Windows.";
      } else {
        pollNote.textContent = "Голос можно отдать один раз.";
      }
    }

    function readPoll(side) {
      return fetch(pollBase + "/get/" + pollNs + "/" + pollKeys[side]).then(function (res) {
        if (res.status === 404) return 0;
        if (!res.ok) throw new Error("count");
        return res.json().then(function (data) {
          return data.value || 0;
        });
      });
    }

    function loadPoll() {
      Promise.all([readPoll("yes"), readPoll("no")]).then(function (pair) {
        pollCounts.yes = pair[0];
        pollCounts.no = pair[1];
        paintPoll();
      }).catch(function () {
        pollNote.textContent = "Счётчик сейчас не открылся. Обновите страницу и попробуйте ещё раз.";
      });
    }

    function sendVote(side) {
      if (pollRead(pollStore)) return;
      for (var i = 0; i < pollButtons.length; i++) pollButtons[i].disabled = true;
      fetch(pollBase + "/hit/" + pollNs + "/" + pollKeys[side]).then(function (res) {
        if (!res.ok) throw new Error("hit");
        return res.json();
      }).then(function (data) {
        pollCounts[side] = data.value || (pollCounts[side] + 1);
        pollWrite(pollStore, side);
        paintPoll();
      }).catch(function () {
        for (var i = 0; i < pollButtons.length; i++) pollButtons[i].disabled = false;
        pollNote.textContent = "Голос не сохранился. Попробуйте ещё раз.";
      });
    }

    for (var b = 0; b < pollButtons.length; b++) {
      pollButtons[b].addEventListener("click", function () {
        sendVote(this.getAttribute("data-vote"));
      });
    }
    loadPoll();
  }
})();
