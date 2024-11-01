"use client";

import { useState } from "react";
import { useFormik } from "formik";
import * as yup from "yup";
import Image from "next/image";
import toast, { Toaster } from "react-hot-toast";
import classNames from "classnames";

export default function KickVODsDownloader() {
  const [result, setResult] = useState(null);
  const [resolutions, setResolutions] = useState([]);
  const [selectedResolution, setSelectedResolution] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  const formik = useFormik({
    initialValues: {
      vodLink: "",
    },
    onSubmit: async () => {
      toast.promise(fetchData(), {
        loading: "Fetching VOD details...",
        success: <b>Details loaded!</b>,
        error: <b>Could not load VOD details</b>,
      });
    },
    validationSchema: yup.object({
      vodLink: yup.string().trim().required("VOD link is required"),
    }),
  });

  const fetchData = async () => {
    const link = formik.values.vodLink.trim();
    const regex = /https:\/\/kick.com\/.*\/videos\/[a-f0-9-]+/;

    if (!regex.test(link)) {
      toast.error("Invalid URL format.");
      return;
    }

    const videoId = link.split("/").pop();
    const apiUrl = `https://kick.com/api/v1/video/${videoId}`;

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      if (data.deleted_at) {
        toast.error("Video has been deleted");
        return;
      }

      const resolutions = await fetchAvailableResolutions(data.source);
      setResolutions(resolutions);
      setSelectedResolution(resolutions[0]);

      setResult({
        title: data.livestream?.session_title || "VOD",
        date: data.created_at,
        game: data.livestream?.categories[0]?.name || "No Game Info",
        thumbnail: data.livestream?.thumbnail,
        channelName:
          data.livestream?.channel?.user?.username || "Unknown Channel",
        url: data.source,
      });
    } catch (error) {
      toast.error("Error loading VOD details.");
    }
  };

  const fetchAvailableResolutions = async (m3u8Link) => {
    try {
      const response = await fetch(m3u8Link);
      const text = await response.text();
      const resolutionMatches =
        text.match(/(\d+p\d+)(?=\/playlist\.m3u8)/g) || [];
      return resolutionMatches;
    } catch {
      toast.error("Error fetching resolutions.");
      return [];
    }
  };

  const downloadVOD = async () => {
    if (!result || !selectedResolution) return;

    setIsDownloading(true);
    toast.success("Download started!");
    setProgress(0);

    const playlistUrl = result.url.replace(
      "/master.m3u8",
      `/${selectedResolution}/playlist.m3u8`
    );

    try {
      const response = await fetch(playlistUrl);
      const playlistText = await response.text();
      const segmentUrls = playlistText
        .split("\n")
        .filter((line) => line && !line.startsWith("#")) // Filter out non-segment lines
        .map((segment) => new URL(segment, playlistUrl).href); // Resolve relative URLs

      const totalSegments = segmentUrls.length;
      let currentProgress = 0;

      const blobs = await Promise.all(
        segmentUrls.map(async (segmentUrl, index) => {
          const segmentResponse = await fetch(segmentUrl);
          const blob = await segmentResponse.blob();

          // Incremental progress update without twitching
          currentProgress = ((index + 1) / totalSegments) * 100;
          setProgress((current) => Math.max(current, currentProgress));

          return blob;
        })
      );

      const fullVideoBlob = new Blob(blobs, { type: "video/mp4" });
      const downloadUrl = URL.createObjectURL(fullVideoBlob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      // add date to file name
      link.download = `${result.channelName}_${selectedResolution}_${new Date(
        result.date
      ).toLocaleDateString()}.mp4`;
      link.click();
      URL.revokeObjectURL(downloadUrl);

      setIsDownloading(false);
      toast.success("Download finished!");
    } catch (error) {
      setIsDownloading(false);
      toast.error("Failed to download VOD segments.");
    }
  };

  const faq = [
    {
      question: "What is a VOD on Kick?",
      answer:
        "A VOD, or Video on Demand, is a recorded stream available for viewing after the live stream has ended on Kick. VODs allow you to watch your favorite content whenever you like.",
    },
    {
      question: "How can I download a VOD from Kick?",
      answer:
        "To download a VOD from Kick, simply paste the VOD link into our Kick VODs Downloader, select the preferred resolution, and start downloading. The tool handles video segmentation and combines them into a single downloadable file.",
    },
    {
      question: "What resolutions are available for Kick VODs?",
      answer:
        "Available resolutions depend on the quality options provided by the streamer. Our Kick VODs Downloader fetches all available resolutions so you can choose the one that fits your needs.",
    },
    {
      question: "Can I download live streams directly from Kick?",
      answer:
        "Our tool is designed to download VODs, which are recorded and saved after live streams end. For live stream downloads, you would need to wait until the stream has finished and is available as a VOD.",
    },
    {
      question: "Is it legal to download VODs from Kick?",
      answer:
        "Downloading content is subject to Kick's Terms of Service and the creator’s permissions. Always ensure you have the right to download and use the content offline.",
    },
    {
      question: "What format will the downloaded Kick VOD be in?",
      answer:
        "Downloaded Kick VODs are in MP4 format, making them compatible with most media players and easy to store offline.",
    },
    {
      question: "How does the Kick VOD Downloader work?",
      answer:
        "The downloader fetches the .m3u8 playlist for the selected VOD, downloads each video segment, and combines them into one file. This makes it possible to store the VOD as a single MP4 file for offline viewing.",
    },
  ];

  return (
    <main className="bg-white">
      <div className="relative min-h-screen px-6 isolate pt-14 lg:px-8">
        <div className="max-w-2xl py-32 mx-auto sm:py-48 lg:py-56">
          <div className="mb-4 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Kick VODs Downloader
            </h1>
            <h2 className="mt-6 text-lg leading-8 text-gray-600">
              Download your favorite Kick VODs.
            </h2>
          </div>

          <section
            className="relative z-[1] py-8 lg:py-12 text-gray-600"
            id="downloader"
          >
            <div className="w-[calc(100%_-_2.5rem)] lg:w-[calc(100%_-_4rem)] mx-auto max-w-lg md:max-w-3xl lg:max-w-5xl">
              <form
                onSubmit={formik.handleSubmit}
                className="flex flex-wrap items-start gap-3"
              >
                <fieldset className="flex-grow lg:mb-8">
                  <div className="grid grid-cols-12 gap-x-3 gap-y-1 lg:gap-5">
                    <div className="col-span-12">
                      <input
                        type="url"
                        className="appearance-none bg-white border h-10 border-gray-300 py-2 px-3 rounded-md text-[1em] leading-tight transition duration-200 outline-none placeholder:opacity-100 placeholder:text-gray-400 focus-within:border-green-700 w-full"
                        id="vodLink"
                        name="vodLink"
                        placeholder="Enter Kick VOD url"
                        value={formik.values.vodLink}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                      {formik.errors.vodLink && (
                        <div
                          className="bg-red-600/20 p-2 lg:p-3 rounded text-sm lg:text-base text-gray-900 mt-1.5 lg:mt-2"
                          role="alert"
                        >
                          <p>{formik.errors.vodLink}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </fieldset>
                <button className="rounded-md bg-green-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500">
                  Fetch Details
                </button>
              </form>

              {result && (
                <div className="mt-8 lg:mt-12">
                  <div className="text-center">
                    <Image
                      src={result.thumbnail}
                      alt="VOD Thumbnail"
                      width={640}
                      height={360}
                      className="w-full max-w-md mx-auto rounded-lg shadow-md"
                    />
                    <h3 className="mt-4 text-2xl font-semibold">
                      {result.title}
                    </h3>
                    <p className="mt-2 text-gray-500">
                      {new Date(result.date).toLocaleDateString()}
                    </p>
                    <p className="text-gray-500">{result.game}</p>
                    <p className="text-gray-500">
                      Channel: {result.channelName}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
                    <div className="flex items-center justify-center">
                      <span className="mr-2">Resolution:</span>
                      <select
                        className="px-4 py-2 border rounded"
                        value={selectedResolution}
                        onChange={(e) => setSelectedResolution(e.target.value)}
                      >
                        {resolutions.map((res, index) => (
                          <option key={index} value={res}>
                            {res}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      aria-label="Download VOD"
                      className="inline-block px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md shadow-sm cursor-pointer hover:bg-green-500"
                      onClick={downloadVOD}
                      disabled={isDownloading}
                    >
                      Download VOD
                    </button>
                  </div>

                  {isDownloading && (
                    <div className="mt-6">
                      <p className="text-center text-gray-700">
                        Downloading... {Math.round(progress)}%
                      </p>
                      <div className="w-full h-4 mt-2 bg-gray-200 rounded-full">
                        <div
                          className="h-4 bg-green-600 rounded-full"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <Toaster />
          </section>
        </div>
      </div>

      <div className="absolute left-0 w-full h-px bg-black"></div>
      {/* FAQ */}
      <section className="relative z-[1] py-8 lg:py-12 text-gray-600">
        <div className="w-[calc(100%_-_2.5rem)] lg:w-[calc(100%_-_4rem)] mx-auto max-w-lg md:max-w-3xl lg:max-w-5xl">
          <div className="mb-8 lg:mb-12">
            <h2 className="text-4xl text-center">Questions &amp; Answers</h2>
          </div>

          <ol className="grid grid-cols-12 text-points text-points--counter gap-y-8 lg:gap-12">
            {faq.map((item, index) => {
              const liClass = classNames({
                "text-points__item col-span-12": true,
                "lg:col-span-6": !item.big,
              });
              return (
                <li key={index} className={liClass}>
                  <div className="text-points__text">
                    <h3 className="mb-1 text-xl">
                      <span
                        className="text-points__bullet after:bg-gray-100 after:rounded-full after:font-semibold after:text-[14px] after:text-gray-500"
                        aria-hidden="true"
                      ></span>
                      {item.question}
                    </h3>

                    <p className="text-sm text-gray-500">{item.answer}</p>

                    {item.steps && (
                      <ol className="mt-4 text-sm text-gray-500 list-decimal list-inside">
                        {item.steps.map((step, index) => (
                          <li key={index}>{step}</li>
                        ))}
                      </ol>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>
    </main>
  );
}
