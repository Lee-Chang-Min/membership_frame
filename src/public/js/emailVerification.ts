document.addEventListener("DOMContentLoaded", function () {
  const verifyEmailButton = document.getElementById("verifyEmailButton");
  const verificationSection = document.getElementById("verificationSection");
  const verificationButtons = document.getElementById("verificationButtons");
  const timerElement = document.getElementById("timer");
  const resendButton = document.getElementById("resendVerificationButton") as HTMLButtonElement;
  let interval: any; // 타이머를 위한 변수 선언

  verifyEmailButton.addEventListener("click", function () {
    this.style.display = "none"; // 이메일 인증 버튼 숨기기
    verificationSection.style.display = "flex"; // 인증번호 입력란 및 타이머 표시
    verificationButtons.style.display = "flex"; // 인증 및 재전송 버튼 표시
    startTimer(180, timerElement); // 타이머 시작
  });

  resendButton.addEventListener("click", function () {
    fetch("/user/verifySend", {
      method: "POST", // 또는 서버 설정에 따라 'GET'
      headers: {
        "Content-Type": "application/json",
        // 필요한 경우 CSRF 토큰 등의 추가적인 헤더를 포함
      },
      // body: JSON.stringify({ 이메일 또는 기타 필요한 데이터 }),
    })
      .then((response) => response.json()) // 응답을 JSON 형태로 파싱
      .then((data) => {
        if (data.result === "success") {
          alert("전송에 성공했습니다.");
        } else if (data.result === "fail") {
          alert("전송에 실패했습니다.");
          console.log(data);
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("요청 처리 중 오류가 발생했습니다.");
      });

    startTimer(180, timerElement); // 타이머 리셋 및 시작
  });

  function startTimer(duration: any, element: any) {
    let time = duration;
    updateTimerDisplay(time, element);
    resendButton.disabled = true; // 타이머 동작 중 재전송 버튼 비활성화

    if (interval) clearInterval(interval); // 기존 인터벌이 있다면 클리어

    interval = setInterval(function () {
      time -= 1;
      updateTimerDisplay(time, element);

      if (time <= 0) {
        clearInterval(interval);
        resendButton.disabled = false; // 재전송 버튼 활성화
      }
    }, 1000);
  }

  document.getElementById("confirmButton").addEventListener("click", function () {
    alert("인증번호가 확인되었습니다.");
  });
});

function updateTimerDisplay(time: any, timerElement: any) {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  timerElement.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}
