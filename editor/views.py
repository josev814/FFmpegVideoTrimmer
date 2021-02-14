from django.shortcuts import render
from django.http import HttpResponse, StreamingHttpResponse
import subprocess
import os
import json


FFMPEG_DIR = r'C:\ffmpeg_dir'

# APP
# TODO: Add job_q
# TODO: generate unique hash for job id
# TODO: Add job to job_q with hash
# TODO: trigger job_q to run
# TODO: Check job table for updates
# TODO: push updates to UI
# TODO: if message is complete clear job

# Job Q
# TODO: Check for jobs
# TODO: Set pickup time
# TODO: Run the job and return the result into the table
# TODO: Set end time and mark completed


# Create your views here.
def index(request):
    #https://nsspot.herokuapp.com/videoeditor/
    cwd = os.getcwd()
    ffmpg_ins = FfmpegInstall(FFMPEG_DIR)
    setup = ffmpg_ins.setup_ffmpeg_dir()
    if setup:
        os.chdir(FFMPEG_DIR)
        if ffmpg_ins.check_download_ffmpeg():
            ffmpg_ins.download_ffmpeg()
        ffmpg_ins.install_ffmpeg()
    os.chdir(cwd)
    return render(request, 'editor/index.html')


class FfmpegInstall(object):
    sevenzfile = 'ffmpeg-release-full.7z'

    def __init__(self, ffmpeg_dir):
        self.ffdir = ffmpeg_dir

    def setup_ffmpeg_dir(self):
        if not os.path.isdir(self.ffdir):
            os.mkdir(self.ffdir)
            return True
        if not os.path.isdir(r'{}\bin'.format(self.ffdir)):
            return True
        return False

    def check_download_ffmpeg(self):
        if not os.path.isfile(r'{}\{}'.format(self.ffdir, self.sevenzfile)):
            return True
        return False

    def download_ffmpeg(self):
        import requests
        sevenz_file = requests.get('https://www.gyan.dev/ffmpeg/builds/{}'.format(self.sevenzfile))
        with open(self.sevenzfile, 'wb') as f:
            f.write(sevenz_file.content)

    def install_ffmpeg(self):
        sevenz = SevenZip()
        if not sevenz.does_7z_exist():
            print('Installing 7zip dependency')
            sevenz.install()
        else:
            fn = 'ffmpeg-release-full.7z'
            subprocess.check_call([sevenz.get_7z_exe(), 'x', '-aoa', '--', fn])
        self._move_ffmpeg_files()

    def _move_ffmpeg_files(self):
        import shutil
        for dir_obj in os.scandir(self.ffdir):
            if dir_obj.is_dir() and dir_obj.name.startswith('ffmpeg-'):
                dirname = dir_obj.name
                break
        for dir_obj in os.scandir(r'{}\{}'.format(self.ffdir, dirname)):
            print('Moving {0}\{1}\{2} to {0}\{2}'.format(self.ffdir, dirname, dir_obj.name))
            shutil.move(r'{}\{}\{}'.format(self.ffdir, dirname, dir_obj.name), r'{}\{}'.format(self.ffdir, dir_obj.name))


class SevenZip(object):
    installer_file = '7z1900-x64.msi'
    installer_domain = 'https://www.7-zip.org/a/'
    install_dir = os.path.join('C:\\', 'Program Files', '7-Zip')
    exefile = '7z.exe'

    def does_7z_exist(self):
        if os.path.isfile(self.get_7z_exe()):
            return True
        return False

    def get_7z_exe(self):
        return os.path.join(self.install_dir, self.exefile)

    def install(self):
        if not self._does_installer_exist():
            self._download_installer()
        self._install_program()
        if self.does_7z_exist():
            self._cleanup_installer()
        else:
            from sys import stderr
            print('Error installing 7zip', stderr)
            exit()

    def _does_installer_exist(self):
        if os.path.exists(self.installer_file):
            return True
        return False

    def _download_installer(self):
        from requests import get
        msi_file = get('{}{}'.format(self.installer_domain, self.installer_file))
        with open(self.installer_file, 'wb') as f:
            f.write(msi_file.content)

    def _install_program(self):
        subprocess.check_output([ self.installer_file ,'/q', 'INSTALLDIR="{}"'.format(self.install_dir)])

    def _cleanup_installer(self):
        os.remove(self.installer_file)


def ffmpeg_render(request, content):
    post_conversion = json.loads(request.body.decode('UTF-8'))
    post_args = post_conversion['conversion']
    arg_list = ['{}\\bin\\ffmpeg.exe'.format(FFMPEG_DIR), '-y', '-filter_threads', '2']
    opened = False
    arg = ''
    for char in post_args:
        if char == "'":
            if opened:
                opened = False
            else:
                opened = True
            continue
        if char == ' ' and not opened:
            arg_list.append(arg)
            arg = ''
        else:
            arg += char
    arg_list.append(arg)


    process = subprocess.Popen(
        #['ffmpeg.exe', '-version'],
        arg_list,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    try:
        stdout, stderr = process.communicate(timeout=15)
    except:
        process.kill()
        stdout, stderr = process.communicate()
        pass
    if stderr != b'':
        return HttpResponse(stderr, content_type='text/plain')
    return HttpResponse('{}\r\n{}\r\n{}\r\n{}'.format(stdout.decode(), stderr.decode(), content, arg_list), content_type='text/plain')
