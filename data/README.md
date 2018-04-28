# EEG Data Analysis
## Research goal
* Visualization of variability in mental activities.
## Sampled data source
* Number of events:
	* 32 Channels. **Channels** corespond to placed electrodes.
	* Electrodes are placed according to the 10-20 System which defines names for specific locations relative to the skull.
	* 30270 events distributed across 384 epochs.
		* An **event** is a discrete voltage sample from an electrode.
		* An **epoch** is a consecutive sequence of events typically associated with a specific stimuli of interest.
## Workflow
* DFST (Complex result) with sample size = 384
	* DFST makes it slightly easier to calculate the power component.
* Zero component represents DC component.
* Find maximum intensity.
	* Intensity = Absolute value of results.
* [Transform Bin to Hz](https://stackoverflow.com/questions/17390677/how-can-i-get-dft-fft-output-frequencies-in-hertz)
### Discrete Sine Fourier Transform
* Discreet samples, aperiodic.
## EEG Analysis
### Playback speed
* 60 FPS
* 46.200313 % real-time
### EEG Bands
* [What are brainwaves?](http://www.brainworksneurotherapy.com/what-are-brainwaves)
* DELTA WAVES (.5 TO 3 HZ)
	* Deep sleep and meditation.
* THETA WAVES (3 TO 8 HZ)
	* Intuition and information beyond our normal conscious awareness.
* ALPHA WAVES (8 TO 12 HZ)
	* Alpha brainwaves occur during quietly flowing thoughts, in the present.
* BETA WAVES (12 TO 38 HZ)
	* Normal waking state, focused mental activity.
	* Mental effort.
		* Lo-Beta (Beta1, 12-15Hz) fast idle.
		* Beta (Beta2, 15-22Hz) is high engagement or actively figuring something out.
		* Hi-Beta (Beta3, 22-38Hz) is highly complex thought, integrating new experiences, high anxiety, or excitement. 
* Converting to frequency.
	* 2992.1875 millisecond
	* 384 bins
	* 7.700052219 bins per millisecond
# References
* [FFT bins from exact frequencies](https://math.stackexchange.com/questions/41984/fft-bins-from-exact-frequencies)
* [Chapter 8: The Discrete Fourier Transform](http://www.dspguide.com/ch8.htm)
	* [The Family of Fourier Transforms](http://www.dspguide.com/ch8/1.htm)
* [Electroencephalography](https://en.wikipedia.org/wiki/Electroencephalography)
* [Electrophysiology of the mind](http://cognitrn.psych.indiana.edu/busey/erp/erpConcept1.pdf)
* [Epoch Averaging: Evoked Responses Across Trials](https://www.mcw.edu/Magnetoencephalography-Program-MEG/Data-Preprocessing/Epoch-Averaging-Evoked-Responses-Across-Trials.htm)
* [Fourier transform](https://en.wikipedia.org/wiki/Fourier_transform)
* [A series of webgl experiments to explore fourier transform calculation complexity.](https://github.com/scrapjs/gl-fourier)
* [npm fourier-transform](https://www.npmjs.com/package/fourier-transformr)
