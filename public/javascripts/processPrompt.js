async function responsePrompt() {
  const input = document.getElementById("userInput").value;
  const loadingDiv = document.getElementById("loading");
  const resultsDiv = document.getElementById("results");
  const accuracyBar = document.getElementById("accuracyBar");
  // TODO: Get the results from other LLM models and compare them, to get the median accuracy value.
  // TODO: And also let the LLMS give feedback based on their first answer to each other on how to improve their results.
  // TODO: find a way to store chat history so that LLM can learn from previous chats.
loadingDiv.classList.remove("d-none");

  // Clear previous results and reset accuracy bar
  resultsDiv.innerHTML = "";
  accuracyBar.style.width = "0%";
  accuracyBar.innerText = "0%";

  try {
    loadingDiv.classList.add("d-block");

    // Send a GET request to the backend
    const response = await fetch(
      "/sepsis-diagnosis?question=" + encodeURIComponent(input)
    );

    // Check if the response is ok (status code in the range 200-299)
    if (!response.ok) {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }

    // Get the response data as JSON
    const data = await response.json();
    console.log("Data:", data);

    // Parse the JSON response
    const parsedResponse = data.response;

    // Extract the Sepsis Percentage from the response
    const sepsisMatch = parsedResponse.match(/Sepsis Percentage: (\d+)%/);
    let sepsisPercentage = 0;
    if (sepsisMatch && sepsisMatch[1]) {
      sepsisPercentage = parseInt(sepsisMatch[1], 10);
    }

    // Update the progress bar based on sepsis percentage
    accuracyBar.style.width = sepsisPercentage + "%";
    accuracyBar.setAttribute("aria-valuenow", sepsisPercentage);
    accuracyBar.innerText = sepsisPercentage + "%";

    // Clear the loading spinner
    loadingDiv.classList.add("d-none");

    // Format and display the detailed recommendations
    resultsDiv.innerHTML = "Results for input: " + input + "<br><br>";

    // Split the response into different sections based on "\n\n"
    const sections = parsedResponse.split("\n\n");

    // Process each section (as in your original code)
    sections.forEach((section) => {
      if (section.startsWith("1.")) {
        const header = document.createElement("h3");
        header.innerText = "Additional Questions to Ask the Patient";
        resultsDiv.appendChild(header);

        const list = document.createElement("ul");
        const questions = section.split("\n").slice(1); // Skip the first line "1. Additional Questions..."
        questions.forEach((question) => {
          if (question.trim().startsWith("-")) {
            const li = document.createElement("li");
            li.innerText = question.trim().substring(1).trim();
            list.appendChild(li);
          }
        });
        resultsDiv.appendChild(list);
      } else if (section.startsWith("2.")) {
        const header = document.createElement("h3");
        header.innerText = "Recommended Tests or Imaging Studies";
        resultsDiv.appendChild(header);

        const list = document.createElement("ul");
        const tests = section.split("\n").slice(1); // Skip the first line "2. Recommended Tests..."
        tests.forEach((test) => {
          1;
          if (test.trim().startsWith("-")) {
            const li = document.createElement("li");
            li.innerText = test.trim().substring(1).trim();
            list.appendChild(li);
          }
        });
        resultsDiv.appendChild(list);
      } else if (section.startsWith("3.")) {
        const header = document.createElement("h3");
        header.innerText = "Potential Differential Diagnoses";
        resultsDiv.appendChild(header);

        const list = document.createElement("ul");
        const diagnoses = section.split("\n").slice(1); // Skip the first line "3. Potential Differential Diagnoses..."
        diagnoses.forEach((diagnosis) => {
          if (diagnosis.trim().startsWith("-")) {
            const li = document.createElement("li");
            li.innerText = diagnosis.trim().substring(1).trim();
            list.appendChild(li);
          }
        });
        resultsDiv.appendChild(list);
      } else if (section.startsWith("4.")) {
        const header = document.createElement("h3");
        header.innerText = "Guidance on Monitoring and Follow-Up";
        resultsDiv.appendChild(header);

        const list = document.createElement("ul");
        const followUps = section.split("\n").slice(1); // Skip the first line "4. Guidance on Monitoring and Follow-Up..."
        followUps.forEach((followUp) => {
          if (followUp.trim().startsWith("-")) {
            const li = document.createElement("li");
            li.innerText = followUp.trim().substring(1).trim();
            list.appendChild(li);
          }
        });
        resultsDiv.appendChild(list);
      }
    });
  } catch (error) {
    // Hide the loading spinner
    loadingDiv.classList.add("d-none");

    // Display the error message
    console.error("Error:", error);
    resultsDiv.innerHTML =
      '<p class="text-danger">Error processing the request. Please try again later.</p>';
  } finally {
    // Clear the input field
    document.getElementById("userInput").value = "";
    loadingDiv.classList.add("d-none");
  }
}
