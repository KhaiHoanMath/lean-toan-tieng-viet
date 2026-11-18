/* © 2026 Nguyễn Đăng Khải Hoàn. Bảo lưu các quyền đối với phần biên soạn nguyên gốc. */
'use strict';

for (const task of document.querySelectorAll('[data-workshop-task]')) {
  const form = task.querySelector('[data-workshop-form]');
  const replies = Array.from(task.querySelectorAll('[data-workshop-reply]'));
  const retry = form.querySelector('[data-workshop-retry]');
  const status = task.querySelector('[data-workshop-status]');

  function clearFeedback() {
    for (const reply of replies) {
      reply.open = false;
      reply.hidden = true;
    }
    retry.hidden = true;
    status.textContent = '';
  }

  clearFeedback();
  form.hidden = false;

  form.addEventListener('change', clearFeedback);
  form.addEventListener('submit', event => {
    event.preventDefault();
    const selected = form.querySelector('input:checked');
    if (!selected) return;
    clearFeedback();
    const reply = replies.find(item => item.dataset.workshopReply === selected.value);
    reply.hidden = false;
    reply.open = true;
    retry.hidden = false;
    status.textContent = reply.querySelector('p').textContent;
  });

  retry.addEventListener('click', () => {
    form.reset();
    clearFeedback();
    form.querySelector('input').focus();
  });
}
